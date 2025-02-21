// User status verification
const checkUserStatus = async (req, res, next) => {
  console.log("Middleware checkUserStatus exécuté");
    const userId = req.user.id; 
  
    try {
      const [user] = await db.query('SELECT status, blockedUntil FROM users WHERE id = ?', [userId]);
  
      if (user.status === 'blocked') {
        const now = new Date();
        if (user.blockedUntil && now < new Date(user.blockedUntil)) {
          return res.status(403).json({ message: "Your account is temporally blocked" });
        } else {
          // Unlock automatically if time has passed
          await db.query('UPDATE users SET status = ?, blockedUntil = ? WHERE id = ?', 
                         ['active', null, userId]);
        }
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  };

module.exports = checkUserStatus;
  