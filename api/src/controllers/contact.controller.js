exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email, and message are required" });
    }
    // In production, send email or save to DB
    console.log(`Contact Form: ${name} (${email}) - ${subject}: ${message}`);
    res.json({ success: true, message: "Message received. We'll get back to you soon." });
  } catch (error) {
    console.error("ContactForm Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required" });
    console.log(`Newsletter subscribe: ${email}`);
    res.json({ success: true, message: "Subscribed successfully!" });
  } catch (error) {
    console.error("Newsletter Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
