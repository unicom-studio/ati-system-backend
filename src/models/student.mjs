import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    regNo: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
    },
    nic: {
      type: String,
      required: [true, 'NIC / ID number is required'],
      trim: true,
      uppercase: true,
    },
    course: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    courseStartedDate: {
      type: Date,
      required: [true, 'Course started date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Completed', 'Cancelled', 'Suspended'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
    },
    contactNo: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    academicYear: {
      type: String,
      trim: true,
      default: '',
    },
    cancellationDate: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast search queries
studentSchema.index({ regNo: 1, nic: 1 });
studentSchema.index({ name: 'text', course: 'text' });

const Student = mongoose.model('Student', studentSchema);

export default Student;
