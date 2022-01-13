import { model, Schema, Document } from 'mongoose'
import { User, UserDocument } from './user'

export interface OrganizationDocument extends Document {
    companyName: string
    folderName: string
    folderAbsolutePath: string
    companyImage: string
    folderAbsolutePathArray: Array<string>
    employees: Array<Document>
    information: object
    addEmployee: (this: OrganizationDocument, employee: UserDocument) => boolean
}

const organizationSchema = new Schema<OrganizationDocument>({
    companyName: {
        type: String,
        required: true
    },
    folderName: {
        type: String
    },
    folderAbsolutePath: {
        type: String
    },
    companyImage: {
        type: String,
        default: 'defaultCompanyImage.png'
    },
    folderAbsolutePathArray: {
        type: [String]
    },
    employees: {
        type: [String]
    },
    information: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: {versionKey: false, minimize: false}
})

//organizationSchema.pre('save', parseAbsolutePath)

organizationSchema.methods.addEmployee = async function(this: OrganizationDocument, employee: UserDocument): Promise<boolean> {
    if (this.employees.indexOf(employee.id) !== -1) {
        console.error(`${this.companyName} already contains employee ${employee.name}`)
        return false
    }

    let promises = this.employees.map(id => {
        return User.exists({ _id: id }).then(result => result ? 'present' : id)
    })

    let results = await Promise.all(promises)

    this.employees = this.employees.filter(id => !results.includes(id))

    console.log(this.employees)

    this.employees.push(employee.id)
    this.save()

    return true
}

function parseAbsolutePath(this: OrganizationDocument) {

    //isModified is true for a new doc
    if (!this.isModified('folderAbsolutePath')) {
        return
    }

    const absolutePathRE = /\/?(\w+)\/?/g

    let absolutePathMatch
    while (absolutePathMatch = absolutePathRE.exec(this.folderAbsolutePath)) {
        if (absolutePathMatch[1] === 'drive') {
            continue
        }
        this.folderAbsolutePathArray.push(absolutePathMatch[1])
    }

    this.folderAbsolutePath = '/drive/' + this.folderAbsolutePathArray.join('/')
    this.folderName = this.folderAbsolutePathArray[this.folderAbsolutePathArray.length - 1]
}

export const Organization = model('Organization', organizationSchema)