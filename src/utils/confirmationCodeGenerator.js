const crypto = require('crypto');

const generateSecureConfirmationCode = () => {
  // Güvenli rastgele 6 haneli alfanumerik kod
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  
  return code;
};

const ensureUniqueCode = async (Order) => {
  let code;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateSecureConfirmationCode();
    const existingOrder = await Order.findOne({ where: { confirmationCode: code } });
    
    if (!existingOrder) {
      return code; // Benzersiz kod bulundu
    }
    
    attempts++;
  } while (attempts < maxAttempts);
  
  throw new Error('Benzersiz onay kodu oluşturulamadı');
};