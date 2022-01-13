import { Document, model, Schema } from 'mongoose';

export interface FileDocument extends Document {
    uploaded: String;
    owner: String;
    group: string;
    read: string[];
    write: string[];
    size: number;
    name: string;
    location: string;
}

const fileSchema = new Schema<FileDocument>({
    uploaded: String,
    owner: String,
    password: String,
    org: String,
    root: String,
    level: String,
    groups: [String]
}, {
    timestamps: true
});

export const File = model<FileDocument>('File', fileSchema);