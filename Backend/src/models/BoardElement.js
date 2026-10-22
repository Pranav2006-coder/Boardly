import mongoose from 'mongoose';

const boardElementSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    elementId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['stroke', 'rectangle', 'circle', 'line', 'arrow', 'text', 'sticky'],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    zIndex: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes
boardElementSchema.index({ boardId: 1, elementId: 1 }, { unique: true });
boardElementSchema.index({ boardId: 1, isDeleted: 1, zIndex: 1 });

export const BoardElement = mongoose.model('BoardElement', boardElementSchema);
export default BoardElement;
