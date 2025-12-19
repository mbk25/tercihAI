const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Sheets API ayarları
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// OAuth2 Client oluştur
function getOAuth2Client() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );
    
    return oauth2Client;
}

// Service Account kullanarak auth (daha kolay yöntem)
async function getAuthClient() {
    try {
        // Service account credentials dosyası varsa kullan
        const credentialsPath = path.join(__dirname, 'google-credentials.json');
        
        if (fs.existsSync(credentialsPath)) {
            const auth = new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: SCOPES,
            });
            return await auth.getClient();
        }
        
        // Yoksa OAuth2 kullan (kullanıcı auth gerektirir)
        console.warn('⚠️ Google Service Account credentials bulunamadı');
        console.warn('💡 google-credentials.json dosyasını backend klasörüne ekleyin');
        return null;
        
    } catch (error) {
        console.error('Google Auth hatası:', error);
        return null;
    }
}

// Yeni spreadsheet oluştur ve kullanıcıya paylaş
async function createSpreadsheet(title, universities, userEmail) {
    try {
        const auth = await getAuthClient();
        if (!auth) {
            throw new Error('Google authentication başarısız');
        }
        
        const sheets = google.sheets({ version: 'v4', auth });
        const drive = google.drive({ version: 'v3', auth });
        
        // 1. Yeni spreadsheet oluştur
        const createResponse = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: title,
                },
                sheets: [{
                    properties: {
                        title: 'Seçtiğim Üniversiteler',
                        gridProperties: {
                            frozenRowCount: 1
                        }
                    }
                }]
            },
        });
        
        const spreadsheetId = createResponse.data.spreadsheetId;
        console.log('✅ Spreadsheet oluşturuldu:', spreadsheetId);
        
        // 2. Başlıkları ekle
        const headers = [
            ['Üniversite Adı', 'Şehir', 'Kampüs', 'Tür', 'Taban Sıralama', 'Kontenjan', 'ÖSYM Şartları']
        ];
        
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Seçtiğim Üniversiteler!A1:G1',
            valueInputOption: 'RAW',
            requestBody: {
                values: headers,
            },
        });
        
        // 3. Üniversite verilerini ekle
        const rows = universities.map(uni => [
            uni.name || '',
            uni.city || '',
            uni.campus || 'Ana Kampüs',
            uni.type || '',
            uni.ranking || uni.minRanking || 'N/A',
            uni.quota || '',
            uni.conditionNumbers ? `Madde ${uni.conditionNumbers}` : 'Yok'
        ]);
        
        if (rows.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Seçtiğim Üniversiteler!A2:G${rows.length + 1}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: rows,
                },
            });
        }
        
        // 4. Formatlama ekle
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    // Başlık satırını kalın yap ve renklendir
                    {
                        repeatCell: {
                            range: {
                                sheetId: 0,
                                startRowIndex: 0,
                                endRowIndex: 1,
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.04, green: 0.64, blue: 0.50 },
                                    textFormat: {
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        fontSize: 11,
                                        bold: true,
                                    },
                                    horizontalAlignment: 'CENTER',
                                },
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                        },
                    },
                    // Sütun genişliklerini ayarla
                    {
                        autoResizeDimensions: {
                            dimensions: {
                                sheetId: 0,
                                dimension: 'COLUMNS',
                                startIndex: 0,
                                endIndex: 7,
                            },
                        },
                    },
                ],
            },
        });
        
        // 5. Kullanıcıya erişim izni ver (eğer email varsa)
        if (userEmail) {
            try {
                await drive.permissions.create({
                    fileId: spreadsheetId,
                    requestBody: {
                        type: 'user',
                        role: 'writer',
                        emailAddress: userEmail,
                    },
                    sendNotificationEmail: false,
                });
                console.log('✅ Kullanıcıya erişim izni verildi:', userEmail);
            } catch (permError) {
                console.warn('⚠️ Erişim izni verilemedi:', permError.message);
            }
        }
        
        // 6. Herkese görüntüleme izni ver
        try {
            await drive.permissions.create({
                fileId: spreadsheetId,
                requestBody: {
                    type: 'anyone',
                    role: 'reader',
                },
            });
        } catch (permError) {
            console.warn('⚠️ Genel görüntüleme izni verilemedi:', permError.message);
        }
        
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        
        return {
            success: true,
            spreadsheetId,
            spreadsheetUrl,
            message: 'Google Sheets başarıyla oluşturuldu!',
        };
        
    } catch (error) {
        console.error('Google Sheets oluşturma hatası:', error);
        throw error;
    }
}

// Mevcut spreadsheet'e veri ekle
async function appendToSpreadsheet(spreadsheetId, universities) {
    try {
        const auth = await getAuthClient();
        if (!auth) {
            throw new Error('Google authentication başarısız');
        }
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        const rows = universities.map(uni => [
            uni.name || '',
            uni.city || '',
            uni.campus || 'Ana Kampüs',
            uni.type || '',
            uni.ranking || uni.minRanking || 'N/A',
            uni.quota || '',
            uni.conditionNumbers ? `Madde ${uni.conditionNumbers}` : 'Yok'
        ]);
        
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Seçtiğim Üniversiteler!A:G',
            valueInputOption: 'RAW',
            requestBody: {
                values: rows,
            },
        });
        
        return {
            success: true,
            message: 'Veriler başarıyla eklendi!',
        };
        
    } catch (error) {
        console.error('Google Sheets ekleme hatası:', error);
        throw error;
    }
}

module.exports = {
    createSpreadsheet,
    appendToSpreadsheet,
    getAuthClient
};
