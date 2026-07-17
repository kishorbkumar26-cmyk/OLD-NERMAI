import { Request, Response, NextFunction } from 'express';
import { StudentService } from './service';
import * as Validators from './validator';

const studentService = new StudentService();

export const listStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const students = await studentService.listStudents(tenantId);
    res.status(200).json({ status: 'success', data: students });
  } catch (error) { next(error); }
};

export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { tenantId } = req.user!;
    const student = await studentService.getStudent(id, tenantId);
    res.status(200).json({ status: 'success', data: student });
  } catch (error) { next(error); }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { userId, tenantId } = req.user!;
    const parsedData = Validators.updateStudentSchema.parse(req.body);
    const updated = await studentService.updateStudent(id, parsedData, userId, tenantId);
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) { next(error); }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    const parsedData = Validators.updateStudentSchema.parse(req.body);
    const updated = await studentService.updateMe(userId, parsedData, tenantId);
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) { next(error); }
};

export const enrollStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    const parsedData = Validators.enrollStudentSchema.parse(req.body);
    const enrollment = await studentService.enrollStudent(
      parsedData.studentId, 
      parsedData.courseId, 
      parsedData.validUntil, 
      userId, 
      tenantId
    );
    res.status(201).json({ status: 'success', data: enrollment });
  } catch (error) { next(error); }
};

export const getStudentEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { tenantId } = req.user!;
    const enrollments = await studentService.getStudentEnrollments(id, tenantId);
    res.status(200).json({ status: 'success', data: enrollments });
  } catch (error) { next(error); }
};

export const createBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    const parsedData = Validators.createBatchSchema.parse(req.body);
    const batch = await studentService.createBatch(parsedData, userId, tenantId);
    res.status(201).json({ status: 'success', data: batch });
  } catch (error) { next(error); }
};

export const listBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    const batches = await studentService.listBatches(tenantId);
    res.status(200).json({ status: 'success', data: batches });
  } catch (error) { next(error); }
};

export const mapStudentToBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.id as string;
    const { batchId } = req.body;
    const { userId, tenantId } = req.user!;
    if (!studentId || !batchId) throw new Error('studentId and batchId required');
    const result = await studentService.mapStudentToBatch(studentId, batchId, userId, tenantId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

export const removeStudentFromBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.id as string;
    const batchId = req.params.batchId as string;
    const { userId, tenantId } = req.user!;
    const result = await studentService.removeStudentFromBatch(studentId, batchId, userId, tenantId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

export const promoteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { userId, tenantId } = req.user!;
    const result = await studentService.promoteStudent(id, userId, tenantId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

export const assignRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const { userId, tenantId } = req.user!;
    if (!role) throw new Error('role is required');
    const result = await studentService.assignRole(id, role, userId, tenantId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

export const getBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { tenantId } = req.user!;
    const batch = await studentService.getBatch(id, tenantId);
    res.status(200).json({ status: 'success', data: batch });
  } catch (error) { next(error); }
};

export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { userId, tenantId } = req.user!;
    await studentService.deleteStudent(id, userId, tenantId);
    res.status(200).json({ status: 'success', message: 'Student deleted successfully' });
  } catch (error) { next(error); }
};

export const updateBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const { userId, tenantId } = req.user!;
    const batch = await studentService.updateBatch(id, data, userId, tenantId);
    res.status(200).json({ status: 'success', data: batch });
  } catch (error) { next(error); }
};

export const deleteBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { userId, tenantId } = req.user!;
    await studentService.deleteBatch(id, userId, tenantId);
    res.status(200).json({ status: 'success', message: 'Batch deleted' });
  } catch (error) { next(error); }
};
