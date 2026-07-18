const Joi = require('joi');

/**
 * Authentication Validation Schemas
 */

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters'
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'string.empty': 'Phone is required'
    }),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'string.empty': 'Password is required'
    }),
  role: Joi.string()
    .valid('OWNER', 'SUPERVISOR', 'LABOR', 'DRIVER')
    .default('LABOR')
});

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters'
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'string.empty': 'Phone is required'
    }),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'string.empty': 'Password is required'
    }),
  role: Joi.string()
    .valid('LABOR', 'SUPERVISOR', 'DRIVER')
    .required()
    .messages({
      'string.empty': 'Role is required'
    }),
  assignedSite: Joi.string()
    .length(24)
    .required()
    .messages({
      'string.length': 'Invalid site ID',
      'any.required': 'Site assignment is required'
    })
});

const loginSchema = Joi.object({
  phone: Joi.string().required().messages({
    'string.empty': 'Phone is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

/**
 * Site Validation Schemas
 */

const createSiteSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Site name is required',
    'string.min': 'Site name must be at least 3 characters'
  }),
  address: Joi.string().trim().min(5).max(200).required().messages({
    'string.empty': 'Address is required'
  }),
  latitude: Joi.number().required().messages({
    'number.base': 'Latitude must be a number',
    'any.required': 'Latitude is required'
  }),
  longitude: Joi.number().required().messages({
    'number.base': 'Longitude must be a number',
    'any.required': 'Longitude is required'
  }),
  radius: Joi.number().min(10).max(5000).default(100).messages({
    'number.min': 'Radius must be at least 10 meters',
    'number.max': 'Radius must not exceed 5000 meters'
  })
});

const updateSiteSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100),
  address: Joi.string().trim().min(5).max(200),
  latitude: Joi.number(),
  longitude: Joi.number(),
  radius: Joi.number().min(10).max(5000)
}).min(1);

/**
 * Attendance Validation Schemas
 */

const checkInSchema = Joi.object({
  siteId: Joi.string().length(24).required().messages({
    'string.length': 'Invalid site ID',
    'string.empty': 'Site ID is required'
  }),
  latitude: Joi.number().required().messages({
    'number.base': 'Latitude must be a number',
    'any.required': 'Latitude is required'
  }),
  longitude: Joi.number().required().messages({
    'number.base': 'Longitude must be a number',
    'any.required': 'Longitude is required'
  })
});

const checkOutSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required()
});

/**
 * Progress Validation Schemas
 */

const createProgressSchema = Joi.object({
  siteId: Joi.string().length(24).required().messages({
    'string.length': 'Invalid site ID'
  }),

  note: Joi.string().trim().max(500).required().messages({
    'string.empty': 'Note is required'
  }),

  progressPercentage: Joi.number()
    .min(0)
    .max(100)
    .default(0)
});
/**
 * Driver Activity Validation Schemas
 */

const startDutySchema = Joi.object({
  vehicleNumber: Joi.string().trim().min(3).required().messages({
    'string.empty': 'Vehicle number is required'
  }),
  startMeter: Joi.number().min(0).required().messages({
    'number.base': 'Start meter must be a number',
    'any.required': 'Start meter reading is required'
  })
});

const endDutySchema = Joi.object({
  endMeter: Joi.number().min(0).required().messages({
    'number.base': 'End meter must be a number',
    'any.required': 'End meter reading is required'
  })
});

/**
 * Validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    // console.log("VALIDATE BODY:", req.body);
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    req.validated = value;
    next();
  };
};

module.exports = {
  validate,
  registerSchema,
  createUserSchema,
  loginSchema,
  createSiteSchema,
  updateSiteSchema,
  checkInSchema,
  checkOutSchema,
  createProgressSchema,
  startDutySchema,
  endDutySchema
};
