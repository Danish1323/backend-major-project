// Import qrcode package to generate QR codes
const QRCode = require('qrcode');

// Generate QR Code as Base64 Data URL (can be embedded directly in <img src="...">)
const generateTableQRCode = async (tableNumber) => {
    try {
        // Data payload encoded inside the QR code
        // Points to our API endpoint or digital menu interface for this specific table
        const payload = `http://localhost:5000/api/qr/table/${tableNumber}`;

        // Options for QR Code rendering
        const options = {
            errorCorrectionLevel: 'H', // High error correction (recovers up to 30% damage)
            type: 'image/png',
            quality: 0.95,
            margin: 2,
            color: {
                dark: '#1e293b',  // Dark slate modules
                light: '#ffffff'  // Crisp white background
            }
        };

        // Generate base64 Data URL string
        const qrDataUrl = await QRCode.toDataURL(payload, options);
        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error.message);
        throw error;
    }
};

module.exports = { generateTableQRCode };
