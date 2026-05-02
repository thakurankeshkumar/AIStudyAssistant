import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    chunks: [
        {
            type: String,
        },
    ],
}, { timestamps: true });


export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);