const bcrypt = require('bcrypt');

const password = '12345678';
bcrypt.hash(password, 10, function(err, hash) {
  if (err) throw err;
  console.log("你的哈希是：", hash);
});
