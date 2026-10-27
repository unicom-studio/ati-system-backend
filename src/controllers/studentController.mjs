import mongoose from 'mongoose';
import Student from '../models/student.mjs';

// @desc    Create a new student
// @route   POST /api/students
// @access  Public (or Protected)
export const createStudent = async (req, res, next) => {
  try {
    const {
      regNo,
      name,
      nic,
      course,
      courseStartedDate,
      idNumber,
      status,
      contactNo,
      phone,
      email,
      academicYear,
      batch,
    } = req.body;

    // Check if student with same regNo already exists
    const existingStudent = await Student.findOne({ regNo: regNo?.trim().toUpperCase() });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `Student with Registration Number '${regNo}' already exists.`,
      });
    }

    const newStudent = await Student.create({
      regNo,
      name,
      nic,
      course,
      courseStartedDate,
      idNumber,
      status,
      contactNo,
      phone,
      email,
      academicYear,
      batch,
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students with optional search, filter & pagination
// @route   GET /api/students
// @access  Public
export const getAllStudents = async (req, res, next) => {
  try {
    const {
      search,
      course,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // Filter by course if specified
    if (course) {
      query.course = new RegExp(`^${course.trim()}$`, 'i');
    }

    // Filter by status if specified
    if (status) {
      query.status = status;
    }

    // Search keyword across regNo, name, nic, or course
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { regNo: searchRegex },
        { name: searchRegex },
        { nic: searchRegex },
        { course: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [total, students] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query).sort(sortOptions).skip(skip).limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Public
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format',
      });
    }

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by Registration Number (helpful for letter generators)
// @route   GET /api/students/reg/:regNo
// @access  Public
export const getStudentByRegNo = async (req, res, next) => {
  try {
    const { regNo } = req.params;

    const student = await Student.findOne({
      regNo: new RegExp(`^${decodeURIComponent(regNo).trim()}$`, 'i'),
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with Registration Number '${regNo}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Public
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format',
      });
    }

    // If regNo is being updated, verify it is not already taken by another student
    if (req.body.regNo) {
      const regTaken = await Student.findOne({
        regNo: req.body.regNo.trim().toUpperCase(),
        _id: { $ne: id },
      });

      if (regTaken) {
        return res.status(409).json({
          success: false,
          message: `Registration number '${req.body.regNo}' is already taken by another student`,
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student details updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student status (e.g. Cancel registration)
// @route   PATCH /api/students/:id/status
// @access  Public
export const updateStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason, cancellationDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format',
      });
    }

    const updateFields = { status };

    if (status === 'Cancelled') {
      updateFields.cancellationDate = cancellationDate || new Date();
      updateFields.cancellationReason = cancellationReason || 'Registration cancelled by request';
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Student status updated to '${status}' successfully`,
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student record
// @route   DELETE /api/students/:id
// @access  Public
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format',
      });
    }

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student statistics overview for dashboard
// @route   GET /api/students/stats/overview
// @access  Public
export const getStudentStats = async (req, res, next) => {
  try {
    const [total, active, cancelled, completed, courseDistribution] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      Student.countDocuments({ status: 'Cancelled' }),
      Student.countDocuments({ status: 'Completed' }),
      Student.aggregate([
        { $group: { _id: '$course', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        cancelled,
        completed,
        courseDistribution: courseDistribution.map((item) => ({
          course: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
