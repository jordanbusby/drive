import Joi from 'joi'

//users
const email = Joi.string().min(8).max(128).lowercase().trim().required();
const name = Joi.string().min(3).max(64).trim().required();
const password = Joi.string().min(4).max(72, 'utf8').trim().required();
const passwordConfirm = Joi.valid(Joi.ref('password')).required();
const organization = Joi.string().min(3).max(32).trim().lowercase().required();
const root = Joi.string().min(10).max(192).trim().required();
const level = Joi.string().valid('user', 'admin', 'super').lowercase()/*.required();*/

//organizations
const companyName = Joi.string().min(3).max(256).trim().required()
const folderAbsolutePath = Joi.string().trim().max(256)
const companyImage = Joi.string().trim().max(256)

export const registerUserSchema = Joi.object({
    email,
    name,
    password,
    passwordConfirm,
    organization,
    root,
    level
});

export const registerOrganizationSchema = Joi.object({
    companyName,
    folderAbsolutePath,
    companyImage
})

export const loginSchema = Joi.object({
    email,
    password
})

export const userUpdateSchema = Joi.object({
    name,
    email,
    password,
    passwordConfirm
})

export const updateSchema = Joi.object({
    name: Joi.string().allow(null, '').min(3).max(128).trim().pattern(/^\w+\s\w+$/),
    email: Joi.string().allow(null, '').min(6).max(128).lowercase().trim().pattern(/^\w+@\w+[.]{1}\w+/),
    password: Joi.string().allow(null, '').min(4).max(72).trim(),
    confirm: Joi.valid(Joi.ref('password'))
})