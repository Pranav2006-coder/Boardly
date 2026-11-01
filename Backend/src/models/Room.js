import mongoose from 'mongoose';

const ROOM_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'viewer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      default: 'Untitled Whiteboard',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Board owner is required'],
    },
    members: [memberSchema],
    isPublic: {
      type: Boolean,
      default: true,
    },
    defaultRole: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'editor',
    },
    backgroundColor: {
      type: String,
      default: '#ffffff',
    },
    gridType: {
      type: String,
      enum: ['dots', 'lines', 'cross', 'none'],
      default: 'dots',
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    template: {
      type: String,
      default: 'blank',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id matching MongoDB _id
roomSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : undefined;
});

// Virtual createdBy for frontend dashboard ownership filtering
roomSchema.virtual('createdBy').get(function () {
  if (!this.owner) return undefined;
  return this.owner._id ? this.owner._id.toString() : this.owner.toString();
});

// Virtual gridStyle mapping to gridType
roomSchema.virtual('gridStyle').get(function () {
  return this.gridType;
});

// Virtual collaborators array representing owner + members
roomSchema.virtual('collaborators').get(function () {
  const list = [];
  if (this.owner) {
    const isPopulated = typeof this.owner === 'object' && this.owner !== null && (this.owner._id || this.owner.id);
    const ownerId = isPopulated ? (this.owner._id || this.owner.id).toString() : this.owner.toString();
    list.push({
      id: ownerId,
      name: isPopulated ? this.owner.name || 'Owner' : 'Owner',
      email: isPopulated ? this.owner.email || '' : '',
      avatarColor: isPopulated ? this.owner.avatarColor || '#7F1D3F' : '#7F1D3F',
      role: 'owner',
    });
  }
  if (Array.isArray(this.members)) {
    for (const m of this.members) {
      if (!m || !m.user) continue;
      const isPopulated = typeof m.user === 'object' && m.user !== null && (m.user._id || m.user.id);
      const uId = isPopulated ? (m.user._id || m.user.id).toString() : m.user.toString();
      list.push({
        id: uId,
        name: isPopulated ? m.user.name || 'Collaborator' : 'Collaborator',
        email: isPopulated ? m.user.email || '' : '',
        avatarColor: isPopulated ? m.user.avatarColor || '#A63D57' : '#A63D57',
        role: m.role || 'viewer',
        joinedAt: m.joinedAt,
      });
    }
  }
  return list;
});

/**
 * Static method generateUniqueRoomCode
 * Builds 6 chars from ABCDEFGHJKLMNPQRSTUVWXYZ23456789,
 * checks with Room.findOne({ roomCode }), and repeats until unused.
 */
roomSchema.statics.generateUniqueRoomCode = async function () {
  const chars = ROOM_CODE_CHARACTERS;
  let code = '';
  let exists = true;

  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }

    const found = await this.findOne({ roomCode: code }).select('_id').lean();
    if (!found) {
      exists = false;
    }
  }

  return code;
};

/**
 * Instance method getUserRole(userId)
 * Order of evaluation:
 * 1. userId equals owner -> "owner"
 * 2. userId is in members -> that member's role ("editor" | "viewer")
 * 3. board is public -> defaultRole
 * 4. otherwise -> null
 */
roomSchema.methods.getUserRole = function (userId) {
  if (!userId) {
    return this.isPublic ? this.defaultRole : null;
  }

  const normalizedUserId = userId._id ? userId._id.toString() : userId.toString();
  const normalizedOwnerId = this.owner?._id ? this.owner._id.toString() : this.owner?.toString();

  // 1. Owner check
  if (normalizedOwnerId && normalizedUserId === normalizedOwnerId) {
    return 'owner';
  }

  // 2. Members check
  if (Array.isArray(this.members)) {
    const member = this.members.find((m) => {
      const mUserId = m.user?._id ? m.user._id.toString() : m.user?.toString();
      return mUserId === normalizedUserId;
    });

    if (member) {
      return member.role;
    }
  }

  // 3. Public board fallback
  if (this.isPublic) {
    return this.defaultRole;
  }

  // 4. Otherwise denied
  return null;
};

export const Room = mongoose.model('Room', roomSchema);
export default Room;
