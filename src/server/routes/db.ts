/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-continue */
import { Router } from 'express'
import { Query } from 'mongoose'
import {
  User, UserDocument, UserDocumentToJSONInterface, OrganizationDocument, Organization
} from '../models'
import { updateSchema } from '../validation'

const router = Router()

export interface DBQueryAPIResponse {
    error: boolean
    queryResult?: Array<UserDocumentToJSONInterface>
    message?: string
}

export function keys<O extends Record<string, unknown>>(obj: O): Array<keyof O> {
  return Object.keys(obj) as Array<keyof O>
}

router.post('/db/query/user', async (req, res) => {
  const { query } = req.body

  res.json({
    error: false,
    queryResult: await User.find(query), // calls toJSON on the returned object
    message: 'Query successful.'
  })
})

router.post('/db/query/org', async (req, res) => {
  const { query } = req.body

  res.json({
    error: false,
    queryResult: await Organization.find(query),
    message: 'Query successful.'
  })
})

interface AccountUpdateSchema {
    [index: string]: string
    name: string
    email: string
    password: string
    confirm: string
}

router.post('/db/update/account', async (req, res) => {
  const {
    name, email, password, confirm
  } = req.body

  const updateObj: AccountUpdateSchema = {
    name,
    email,
    password,
    confirm
  };

  const validationResult = updateSchema.validate(updateObj)

  if (validationResult.error) {
    res.json({
      error: true,
      result: validationResult,
      message: validationResult.error.message
    })
    return
  }

  if (updateObj.email) {
    const exists = await User.findOne({ email: updateObj.email })
    if (exists) {
      res.json({
        error: true,
        message: `Email ${updateObj.email} already exists`
      })
      return
    }
  }

  const currentUser = await User.findById(req.session.user._id) as any
  for (const key of keys(updateObj)) {
    if (key === 'confirm' || updateObj[key] === '') {
      continue
    }
    currentUser[key] = updateObj[key]
  }

  req.session.user = await currentUser.save()

  res.json({
    error: false,
    result: req.session.user,
    message: 'Update successful'
  })
})

export default router
