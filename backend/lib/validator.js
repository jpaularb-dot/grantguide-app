// lib/validator.js — lightweight server-side input validation.
// Same chainable API as the PHP Validator: Validator.make(body).required(...).validateOrFail();
import { ApiError } from './response.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Validator {
  constructor(data) {
    this.data = data || {};
    this.errors = {};
  }

  static make(data) {
    return new Validator(data);
  }

  val(field) {
    return this.data[field];
  }

  required(field, label = null) {
    const v = this.val(field);
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      this.errors[field] = (label ?? cap(field)) + ' is required.';
    }
    return this;
  }

  email(field) {
    const v = this.val(field);
    if (v && !EMAIL_RE.test(String(v))) {
      this.errors[field] = 'Please enter a valid email address.';
    }
    return this;
  }

  min(field, len) {
    const v = this.val(field);
    if (v !== undefined && v !== null && String(v).length < len) {
      this.errors[field] = cap(field) + ` must be at least ${len} characters.`;
    }
    return this;
  }

  in(field, allowed) {
    const v = this.val(field);
    if (v !== undefined && v !== null && !allowed.includes(v)) {
      this.errors[field] = 'Invalid value for ' + field + '.';
    }
    return this;
  }

  fails() {
    return Object.keys(this.errors).length > 0;
  }

  // Throw a 422 with the field errors if validation failed.
  validateOrFail() {
    if (this.fails()) throw new ApiError('Validation failed.', 422, this.errors);
  }
}
