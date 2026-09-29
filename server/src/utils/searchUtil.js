const Doctor = require('../models/Doctor');
const User = require('../models/User');

/**
 * Escapes special regular expression characters in a user-provided search string.
 * Helps prevent ReDoS (Regular Expression Denial of Service) and regex injection.
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Performs database-level doctor search across name, specialization name, and qualification.
 */
const findDoctorsInDatabase = async ({ specializationId, search, includeInactive = false, page = 1, limit = 20 }) => {
  const matchFilter = {};

  if (!includeInactive) {
    matchFilter.isActive = true;
  }

  if (specializationId) {
    matchFilter.specializationId = specializationId;
  }

  let pipeline = [
    { $match: matchFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'specializations',
        localField: 'specializationId',
        foreignField: '_id',
        as: 'specialization'
      }
    },
    { $unwind: { path: '$specialization', preserveNullAndEmptyArrays: true } }
  ];

  // If user provided a search term, escape regex and perform DB match across name, specialization name, qualification
  if (search && search.trim()) {
    const escapedSearch = escapeRegex(search.trim());
    const searchRegex = new RegExp(escapedSearch, 'i');

    pipeline.push({
      $match: {
        $or: [
          { 'user.name': searchRegex },
          { 'specialization.name': searchRegex },
          { qualification: searchRegex }
        ]
      }
    });
  }

  // Count total matching documents before pagination
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Doctor.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Pagination skip and limit
  const skip = (page - 1) * limit;
  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const doctors = await Doctor.aggregate(pipeline);

  // Format into response objects
  const formatted = doctors.map(doc => ({
    id: doc._id,
    name: doc.user?.name || '',
    email: doc.user?.email || '',
    specialization: doc.specialization ? {
      id: doc.specialization._id,
      name: doc.specialization.name,
      description: doc.specialization.description
    } : null,
    qualification: doc.qualification,
    experience: doc.experience,
    consultationFee: doc.consultationFee,
    phone: doc.phone || '',
    bio: doc.bio || '',
    profileImage: doc.profileImage || '',
    availability: doc.availability || [],
    isActive: doc.isActive
  }));

  return {
    doctors: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  escapeRegex,
  findDoctorsInDatabase
};
