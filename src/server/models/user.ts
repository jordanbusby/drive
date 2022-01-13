import { compare, hash } from 'bcryptjs'
import { Document, model, Schema } from 'mongoose';
import { Request } from 'express';
import { BCRYPT_WORK_FACTOR } from '../config';

export interface UserDocument extends Document {
    email: string;
    name: string;
    password: string;
    organization: string;
    root: string;
    rootArray: string[];
    passwordMatch(s: string): Promise<boolean>
    loggedInUser(req: Request): Promise<UserDocument>
    level: string;
    groups: string[];
    lastLogin: Date
    history: object[]
    messages: Array<any>
    loggedIn: boolean
}

export interface UserDocumentToJSONInterface {
    name: string
    email: string
    organization: string
    root: string
    rootArray: Array<string>
    level: 'user' | 'admin' | 'super'
    groups: Array<string>
    lastLogin?: string
    history: Array<any>
    messages: Array<any>
    updatedAt: string
    createdAt: string
    _id: string
    loggedIn: boolean
}

export type UserActions = 'move' | 'delete' | 'login' | 'logout' | 'copy' | 'print' | 'register' | 'update' | 'rename' | 'sendmessage' | 'receivemessage' | 'other'

export interface UserHistoryDocument extends Document {
    actionType: UserActions
    time?: Date
    files?: Array<object>
    directory?: string
    ipaddress?: string
    message?: string
}

export const userHistorySchema = new Schema<UserHistoryDocument>({
  actionType: {
    type: String,
    lowercase: true
  },
  time: Date,
  files: [Schema.Types.Mixed],
  directory: String,
  ipaddress: String,
  message: String
})

export const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  organization: {
    type: String
  },
  root: {
    type: String
  },
  rootArray: {
    type: [String],
  },
  level: {
    type: String,
    enum: ['user', 'admin', 'super'],
    default: 'user',
    lowercase: true
  },
  groups: {
    type: [String]
  },
  lastLogin: {
    type: Date
  },
  loggedIn: {
    type: Boolean,
    default: false
  },
  history: {
    type: [userHistorySchema]
  },
  messages: {
    type: [Schema.Types.Mixed]
  }
}, {
  timestamps: true,
  autoCreate: false,
  minimize: false
});

userSchema.methods.passwordMatch = function (password: string) {
  return compare(password, this.password);
}

userSchema.pre<UserDocument>('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password, BCRYPT_WORK_FACTOR);
  }

  if (this.isModified('root')) {
    let rootFolder = this.root
    if (rootFolder.startsWith('/')) {
      rootFolder = rootFolder.slice(1)
    }
    if (rootFolder.endsWith('/')) {
      rootFolder = rootFolder.slice(0, -1)
    }
    this.rootArray = rootFolder.split('/')
  }
});

userSchema.set('toJSON', {
  transform: (doc: UserDocument, { __v, password, ...rest }: { __v: string, password: string, rest: string[]}, options: any) => rest
});

export const User = model<UserDocument>('User', userSchema);
