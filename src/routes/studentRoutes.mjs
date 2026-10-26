import express from 'express';
import {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByRegNo,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
  getStudentStats,
} from '../controllers/studentController.mjs';

const router = express.Router();

// Statistics endpoint for Dashboard
router.get('/stats/overview', getStudentStats);

// Lookup by Registration Number
router.get('/reg/:regNo', getStudentByRegNo);

// Student CRUD routes
router.route('/')
  .get(getAllStudents)
  .post(createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

// Specific Status update route (e.g. Cancellation)
router.patch('/:id/status', updateStudentStatus);

export default router;
