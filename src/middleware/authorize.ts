export function authorize(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user; // set earlier by your auth middleware
    if (!user || !allowedRoles.includes(user.user_type)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
}