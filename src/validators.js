const Joi = require('joi');

// Key validation schema
const keySchema = Joi.string()
  .min(1)
  .max(255)
  .pattern(/^[a-zA-Z0-9_\-\.]+$/)
  .required()
  .messages({
    'string.empty': 'Key cannot be empty',
    'string.min': 'Key must be at least 1 character long',
    'string.max': 'Key cannot exceed 255 characters',
    'string.pattern.base': 'Key can only contain alphanumeric characters, underscores, hyphens, and dots'
  });

// Value validation schema - accepts any valid JSON
const valueSchema = Joi.object()
  .min(1)
  .required()
  .messages({
    'object.min': 'Request body must contain at least one key-value pair',
    'any.required': 'Request body is required'
  });

// Timestamp validation schema
const timestampSchema = Joi.string()
  .pattern(/^\d+$/)
  .custom((value, helpers) => {
    const timestamp = parseInt(value);
    if (timestamp < 0) {
      return helpers.error('any.invalid');
    }
    if (timestamp > Math.floor(Date.now() / 1000) + 86400) { // Allow 1 day in future
      return helpers.error('any.invalid');
    }
    return timestamp;
  })
  .messages({
    'string.pattern.base': 'Timestamp must be a valid unix timestamp (numeric string)',
    'any.invalid': 'Timestamp must be a valid unix timestamp and not too far in the future'
  });

function validateKey(key) {
  return keySchema.validate(key);
}

function validateValue(value) {
  return valueSchema.validate(value);
}

function validateTimestamp(timestamp) {
  return timestampSchema.validate(timestamp);
}

module.exports = {
  validateKey,
  validateValue,
  validateTimestamp,
  keySchema,
  valueSchema,
  timestampSchema
};
