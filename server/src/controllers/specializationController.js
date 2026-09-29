const Specialization = require('../models/Specialization');
const Doctor = require('../models/Doctor');
const { AppError, catchAsync } = require('../utils/AppError');

// GET /api/specializations
const getSpecializations = catchAsync(async (req, res, next) => {
  const specializations = await Specialization.find({ isActive: true }).sort({ name: 1 });
  return res.json({
    success: true,
    data: specializations
  });
});

// POST /api/specializations (Admin only)
const createSpecialization = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;

  const existing = await Specialization.findOne({ name: name.trim() }).collation({ locale: 'en', strength: 2 });
  if (existing) {
    throw AppError.conflict('Specialization with this name already exists.');
  }

  const spec = await Specialization.create({
    name: name.trim(),
    description: description ? description.trim() : ''
  });

  return res.status(201).json({
    success: true,
    data: spec
  });
});

// PUT /api/specializations/:id (Admin only)
const updateSpecialization = catchAsync(async (req, res, next) => {
  const { name, description, isActive } = req.body;
  const spec = await Specialization.findById(req.params.id);
  if (!spec) {
    throw AppError.notFound('Specialization not found.');
  }

  // Requirement 8: Block deactivating a specialization if active doctors are using it
  if (isActive === false && spec.isActive === true) {
    const activeDoctorCount = await Doctor.countDocuments({
      specializationId: spec._id,
      isActive: true
    });
    if (activeDoctorCount > 0) {
      throw AppError.conflict(`Cannot deactivate specialization '${spec.name}' because ${activeDoctorCount} active doctor profile(s) currently use it.`);
    }
  }

  if (name !== undefined) spec.name = name.trim();
  if (description !== undefined) spec.description = description.trim();
  if (isActive !== undefined) spec.isActive = isActive;

  await spec.save();

  return res.json({
    success: true,
    data: spec
  });
});

// DELETE /api/specializations/:id (Admin only)
const deleteSpecialization = catchAsync(async (req, res, next) => {
  const spec = await Specialization.findById(req.params.id);
  if (!spec) {
    throw AppError.notFound('Specialization not found.');
  }

  // Requirement 8: Block deactivating a specialization if active doctors are using it
  const activeDoctorCount = await Doctor.countDocuments({
    specializationId: spec._id,
    isActive: true
  });
  if (activeDoctorCount > 0) {
    throw AppError.conflict(`Cannot deactivate specialization '${spec.name}' because ${activeDoctorCount} active doctor profile(s) currently use it.`);
  }

  spec.isActive = false;
  await spec.save();

  return res.json({
    success: true,
    message: 'Specialization deactivated successfully.'
  });
});

module.exports = {
  getSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization
};
