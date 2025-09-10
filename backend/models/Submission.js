const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    note: { type: String },
    originalImageUrls: [{ type: String }],

    // --- FINAL CHANGE: Legend is now at the top level ---
    legends: [{
        color: String,
        text: String,
    }],

    // Annotations no longer contain their own legends
    annotations: [{
        originalUrl: String,
        annotatedImageUrl: String,
        annotationData: { // annotationData now only holds shapes
            shapes: [Object]
        },
    }],

    reportUrl: { type: String },
    status: {
        type: String,
        enum: ['uploaded', 'annotated', 'reported'],
        default: 'uploaded'
    }
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);