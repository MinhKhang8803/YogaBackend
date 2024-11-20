require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware để log thông tin request
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    console.log(`Request Method: ${req.method}`);
    console.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    next();
});

// Middleware để parse JSON payload
app.use(express.json()); // Thay thế body-parser cho JSON
app.use(express.urlencoded({ extended: true })); // Để parse form-encoded payload

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 
    'mongodb+srv://KhangYogaApp:khangkhanh0304@yogaapp.c0ddr.mongodb.net/YogaDB';

mongoose
    .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Schema và Models
const yogaClassSchema = new mongoose.Schema({
    id: { type: String, required: true },
    dayOfWeek: String,
    time: String,
    type: String,
    price: Number,
    capacity: Number,
    duration: Number,
    description: String,
});

const classInstanceSchema = new mongoose.Schema({
    id: { type: String, required: true },
    yogaClassId: String,
    date: String,
    teacher: String,
    comments: String,
});

const YogaClass = mongoose.model('YogaClass', yogaClassSchema);
const ClassInstance = mongoose.model('ClassInstance', classInstanceSchema);

// Endpoint: Sync data
app.post('/sync', async (req, res) => {
    try {
        console.log('Received Payload:', req.body); // Log payload nhận được

        const { yogaClasses, classInstances } = req.body;

        if (!yogaClasses || !classInstances) {
            return res.status(400).json({ 
                error: 'Payload không hợp lệ! Yêu cầu có yogaClasses và classInstances.' 
            });
        }

        console.log('Sync Payload:', { yogaClasses, classInstances });

        // Xóa dữ liệu cũ
        await YogaClass.deleteMany({});
        await ClassInstance.deleteMany({});

        // Thêm dữ liệu mới
        await YogaClass.insertMany(
            yogaClasses.map((cls) => ({
                id: cls.id,
                dayOfWeek: cls.dayOfWeek,
                time: cls.time,
                type: cls.type,
                price: cls.price,
                capacity: cls.capacity,
                duration: cls.duration,
                description: cls.description,
            }))
        );

        await ClassInstance.insertMany(
            classInstances.map((inst) => ({
                id: inst.id,
                yogaClassId: inst.yogaClassId,
                date: inst.date,
                teacher: inst.teacher,
                comments: inst.comments,
            }))
        );

        res.status(200).json({ message: 'Đồng bộ thành công!' });
    } catch (err) {
        console.error('Error during sync:', err);
        res.status(500).json({ error: 'Đồng bộ thất bại: ' + err.message });
    }
});

// Endpoint: Lấy danh sách lớp học
app.get('/classes', async (req, res) => {
    try {
        const classes = await YogaClass.find();
        res.status(200).json(classes);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint: Thêm lớp học mới
app.post('/classes', async (req, res) => {
    try {
        const yogaClass = new YogaClass(req.body);
        await yogaClass.save();
        res.status(201).json(yogaClass);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Endpoint: Lấy danh sách phiên bản lớp học
app.get('/class-instances', async (req, res) => {
    try {
        const instances = await ClassInstance.find();
        res.status(200).json(instances);
    } catch (err) {
        console.error('Error fetching class instances:', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint: Thêm phiên bản lớp học mới
app.post('/class-instances', async (req, res) => {
    try {
        const instance = new ClassInstance(req.body);
        await instance.save();
        res.status(201).json(instance);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
