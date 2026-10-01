export type MasarLocale = "ar" | "en";

const exactEnglish: Record<string, string> = {
  // Navigation / common
  "مركز الرحلات": "Journey Center",
  "من نحن": "About Us",
  "المسارات المهنية": "Career Paths",
  "رحلاتي التعليمية": "My Learning Journeys",
  "اتصل بنا": "Contact Us",
  "تواصل معنا": "Contact Us",
  "فتح القائمة": "Open menu",
  "إغلاق القائمة": "Close menu",
  "العودة إلى الصفحة الرئيسية": "Back to Home",
  "العودة لإكمال التسجيل": "Back to Registration",
  "العودة إلى تسجيل الدخول": "Back to Login",
  "الانتقال إلى تسجيل الدخول": "Go to Login",
  "العربية": "Arabic",
  "English": "English",
  "صناع المسار": "Masar Makers",
  "بوابة صناع المسار": "Masar Makers Portal",

  // Home page
  "اختر المسار الذي يقودك إلى مستقبل احترافي": "Choose the path that leads you toward a stronger professional future",
  "كيف تحب أن تتعلم؟": "How would you like to learn?",
  "اختر أسلوب التعلم الذي يناسب وقتك وهدفك": "Choose the learning format that fits your time and goal",
  "لماذا صناع المسار؟": "Why Masar Makers?",
  "رحلات تعليمية احترافية تساعدك على بناء مسيرتك المهنية": "Professional learning journeys designed to help you build your career",
  "الرحلات الأكثر طلبًا": "Most Popular Journeys",
  "اكتشف الرحلات التي اختارها أكبر عدد من المهندسين لتطوير مهاراتهم": "Discover the journeys most engineers choose to advance their skills",
  "من التدريب إلى التنفيذ": "From Training to Delivery",
  "نماذج من مشاريع المتدربين التي تحولت فيها المعرفة إلى تطبيقات هندسية حقيقية": "Student projects where learning became real engineering practice",
  "قصص نجاح المتدربين": "Student Success Stories",
  "آراء وتجارب مهندسين تحول فيها التعلم إلى تطبيق عملي ونتائج مهنية حقيقية": "Engineer experiences where learning became practical work and real professional results",
  "شركاؤنا في النجاح": "Our Success Partners",
  "تعاونات مهنية وتقنية تساعدنا على تقديم تجربة تعلم أكثر قوة وارتباطًا بسوق العمل": "Professional and technical partnerships that strengthen learning and connect it to the job market",
  "ابدأ رحلتك الآن": "Start Your Journey Now",
  "اختر هدفك وابدأ بخطوة عملية تقودك إلى مستوى مهني أقوى": "Choose your goal and take a practical first step toward a stronger professional level",

  // Auth shell
  "رحلتك المهنية تبدأ هنا": "Your professional journey starts here",
  "لا تتعلم كورسًا فقط": "Don't just take a course",
  "ابنِ مسيرتك المهنية": "Build your professional career",
  "سجّل دخولك لاستكشاف المسارات والورش والمحاضرات المجانية، وتتبع تقدمك ومشاريعك وشهاداتك داخل رحلة تعليمية واحدة.": "Sign in to explore career paths, workshops and free lectures, and track your progress, projects and certificates in one learning journey.",
  "مسارات احترافية": "Professional Paths",
  "تطبيقات عملية": "Practical Applications",
  "مشاريع وشهادات": "Projects & Certificates",

  // Login
  "مرحبًا بعودتك": "Welcome Back",
  "سجّل دخولك لاستكمال رحلاتك واستكشاف جميع محتويات المنصة.": "Sign in to continue your journeys and explore all platform content.",
  "البريد الإلكتروني": "Email Address",
  "كلمة المرور": "Password",
  "نسيت كلمة المرور؟": "Forgot password?",
  "تذكر تسجيل دخولي": "Keep me signed in",
  "تسجيل الدخول": "Sign In",
  "جاري تسجيل الدخول...": "Signing in...",
  "ليس لديك حساب؟": "Don't have an account?",
  "إنشاء حساب جديد": "Create a New Account",
  "تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول.": "Your email has been confirmed successfully. You can now sign in.",
  "تعذر استخدام رابط التأكيد. ربما تم استخدامه مسبقًا أو انتهت صلاحيته.": "The confirmation link could not be used. It may have already been used or expired.",
  "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.": "Your password was changed successfully. You can now sign in with your new password.",
  "يرجى إدخال البريد الإلكتروني وكلمة المرور.": "Please enter your email address and password.",
  "يرجى تأكيد بريدك الإلكتروني أولًا، ثم محاولة تسجيل الدخول.": "Please confirm your email address first, then try signing in again.",
  "البريد الإلكتروني أو كلمة المرور غير صحيحة.": "The email address or password is incorrect.",
  "تعذر تسجيل الدخول. حاولي مرة أخرى.": "Unable to sign in. Please try again.",
  "حدث خطأ غير متوقع أثناء تسجيل الدخول.": "An unexpected error occurred while signing in.",
  "إخفاء كلمة المرور": "Hide password",
  "إظهار كلمة المرور": "Show password",

  // Register
  "أنشئ حسابك": "Create Your Account",
  "انضم إلى صناع المسار وابدأ استكشاف المسارات والورش والمحاضرات المجانية.": "Join Masar Makers and start exploring career paths, workshops and free lectures.",
  "الاسم الكامل": "Full Name",
  "اكتب اسمك الكامل": "Enter your full name",
  "الاسم باللغة الإنجليزية": "Name in English",
  "اكتب اسمك كما ترغب أن يظهر في الشهادات الصادرة من المنصة.": "Enter your name exactly as you want it to appear on certificates issued by the platform.",
  "رقم الهاتف مع كود الدولة": "Phone Number with Country Code",
  "الدولة": "Country",
  "اختر الدولة": "Select Country",
  "السعودية": "Saudi Arabia",
  "مصر": "Egypt",
  "الإمارات": "United Arab Emirates",
  "عُمان": "Oman",
  "العراق": "Iraq",
  "ليبيا": "Libya",
  "السودان": "Sudan",
  "سوريا": "Syria",
  "نيجيريا": "Nigeria",
  "دولة أخرى": "Other Country",
  "المسمى الوظيفي": "Job Title",
  "اختر المسمى الوظيفي": "Select Job Title",
  "طالب": "Student",
  "مهندس": "Engineer",
  "استشاري": "Consultant",
  "مدير مشروع": "Project Manager",
  "مدرب": "Trainer",
  "أخرى": "Other",
  "سنوات الخبرة": "Years of Experience",
  "اختر سنوات الخبرة": "Select Experience",
  "أقل من سنتين": "Less than 2 years",
  "من سنتين إلى 5 سنوات": "2 to 5 years",
  "من 5 إلى 10 سنوات": "5 to 10 years",
  "أكثر من 10 سنوات": "More than 10 years",
  "التخصص": "Specialty",
  "اختر التخصص": "Select Specialty",
  "تصميم الطرق": "Road Design",
  "هندسة المرور": "Traffic Engineering",
  "الهندسة المدنية": "Civil Engineering",
  "المساحة": "Surveying",
  "تأكيد كلمة المرور": "Confirm Password",
  "8 أحرف على الأقل": "At least 8 characters",
  "أعد كتابة كلمة المرور": "Re-enter password",
  "أوافق على": "I agree to",
  "الشروط والأحكام": "Terms & Conditions",
  "سياسة الخصوصية": "Privacy Policy",
  "الخاصة بمنصة صناع المسار.": "of the Masar Makers platform.",
  "إنشاء الحساب": "Create Account",
  "جاري إنشاء الحساب...": "Creating account...",
  "لدي حساب بالفعل": "I already have an account",
  "يرجى إدخال الاسم الكامل.": "Please enter your full name.",
  "يرجى إدخال الاسم باللغة الإنجليزية كما ترغب أن يظهر في الشهادة.": "Please enter your English name as you want it to appear on the certificate.",
  "يرجى كتابة الاسم الإنجليزي باستخدام الحروف الإنجليزية فقط.": "Please enter the English name using English letters only.",
  "يرجى إدخال البريد الإلكتروني.": "Please enter your email address.",
  "يرجى إدخال رقم الهاتف.": "Please enter your phone number.",
  "يرجى اختيار الدولة.": "Please select your country.",
  "يجب ألا تقل كلمة المرور عن 8 أحرف.": "The password must be at least 8 characters long.",
  "كلمتا المرور غير متطابقتين.": "The passwords do not match.",
  "يجب الموافقة على الشروط والأحكام قبل إنشاء الحساب.": "You must agree to the Terms & Conditions before creating an account.",
  "هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول.": "This email address is already registered. You can sign in instead.",
  "تعذر إنشاء الحساب. حاول مرة أخرى.": "Unable to create the account. Please try again.",
  "تم إنشاء الحساب بنجاح. أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. افتح الرسالة واضغط على رابط التأكيد.": "Your account was created successfully. We sent a confirmation email. Open it and click the confirmation link.",
  "حدث خطأ غير متوقع أثناء إنشاء الحساب.": "An unexpected error occurred while creating the account.",
  "إخفاء تأكيد كلمة المرور": "Hide password confirmation",
  "إظهار تأكيد كلمة المرور": "Show password confirmation",

  // Forgot / reset password
  "أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإنشاء كلمة مرور جديدة.": "Enter your email address and we'll send you a secure link to create a new password.",
  "إرسال رابط إعادة التعيين": "Send Reset Link",
  "جاري إرسال الرابط...": "Sending link...",
  "تعذر إرسال رابط إعادة تعيين كلمة المرور حاليًا. حاولي مرة أخرى.": "Unable to send the password reset link right now. Please try again.",
  "إذا كان هذا البريد مرتبطًا بحساب على المنصة، فسيصلك رابط إعادة تعيين كلمة المرور. تحققي أيضًا من البريد غير المرغوب فيه (Spam).": "If this email is linked to an account, you will receive a password reset link. Please also check your Spam folder.",
  "حدث خطأ غير متوقع. حاولي مرة أخرى.": "An unexpected error occurred. Please try again.",
  "إعادة تعيين كلمة المرور": "Reset Password",
  "جاري التحقق من رابط الاستعادة...": "Checking your recovery link...",
  "جاري التحقق...": "Checking...",
  "رابط غير صالح": "Invalid Link",
  "تعذر التحقق من رابط إعادة تعيين كلمة المرور.": "We couldn't verify the password reset link.",
  "قد يكون الرابط قد انتهت صلاحيته أو تم استخدامه مسبقًا. اطلبي رابط استعادة جديدًا.": "The link may have expired or already been used. Please request a new recovery link.",
  "طلب رابط جديد": "Request a New Link",
  "كلمة مرور جديدة": "New Password",
  "أنشئ كلمة مرور جديدة لحسابك على منصة صناع المسار.": "Create a new password for your Masar Makers account.",
  "كلمة المرور الجديدة": "New Password",
  "تأكيد كلمة المرور الجديدة": "Confirm New Password",
  "حفظ كلمة المرور الجديدة": "Save New Password",
  "جاري تغيير كلمة المرور...": "Changing password...",
  "يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.": "The new password must be at least 8 characters long.",
  "كلمتا المرور الجديدتان غير متطابقتين.": "The new passwords do not match.",
  "رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته. اطلبي رابطًا جديدًا.": "The password reset link is invalid or expired. Please request a new link.",
  "تعذر تحديث كلمة المرور. قد يكون الرابط قد انتهت صلاحيته، اطلبي رابطًا جديدًا.": "Unable to update the password. The link may have expired; please request a new one.",
  "تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة تسجيل الدخول.": "Your password was changed successfully. You will be redirected to the sign-in page.",
  "حدث خطأ غير متوقع أثناء تغيير كلمة المرور.": "An unexpected error occurred while changing the password.",
  "تم تأكيد بريدك بنجاح": "Your Email Has Been Confirmed",
  "أصبح حسابك في صناع المسار جاهزًا، ويمكنك الآن تسجيل الدخول واستكشاف رحلتك التعليمية.": "Your Masar Makers account is ready. You can now sign in and explore your learning journey.",

  // Terms page
  "قبول الشروط": "Acceptance of Terms",
  "الحساب وبيانات الدخول": "Account & Sign-in Details",
  "المحتوى التعليمي وحقوق الاستخدام": "Educational Content & Usage Rights",
  "الاشتراكات وتفعيل الرحلات": "Enrollments & Journey Activation",
  "الدفع والإلغاء والاسترداد": "Payment, Cancellation & Refunds",
  "الشهادات والإنجازات": "Certificates & Achievements",
  "المشاريع والأعمال التي يرفعها الطالب": "Student Projects & Uploaded Work",
  "البيانات والخصوصية": "Data & Privacy",
  "الاستخدام المقبول": "Acceptable Use",
  "تحديث الشروط": "Updates to These Terms",
  "توضح هذه الصفحة القواعد الأساسية لاستخدام منصة Masar Makers والخدمات والمحتوى التعليمي المتاح من خلالها.": "This page explains the main rules for using the Masar Makers platform, its services and educational content.",
  "آخر تحديث: أغسطس 2026": "Last updated: August 2026",
  "محتويات الصفحة": "Page Contents",
  "قبل إنشاء الحساب": "Before Creating an Account",
  "عند التسجيل سيُطلب منك تأكيد قراءة هذه الشروط والموافقة عليها. ننصح بقراءتها كاملة قبل المتابعة.": "During registration, you will be asked to confirm that you have read and accepted these terms. We recommend reading them fully before continuing.",
  "هل لديك استفسار عن الشروط؟": "Have a Question About the Terms?",
  "يمكنك التواصل معنا قبل إنشاء الحساب أو الاشتراك في أي رحلة للحصول على توضيح حول بنود الاستخدام أو الاشتراك.": "You can contact us before creating an account or enrolling in any journey if you need clarification about usage or enrollment terms.",
  "باستخدام منصة Masar Makers أو إنشاء حساب بها، فإنك تقر بأنك قرأت هذه الشروط والأحكام وفهمتها ووافقت على الالتزام بها.": "By using Masar Makers or creating an account, you confirm that you have read, understood and agreed to these Terms & Conditions.",
  "إذا كنت لا توافق على أي جزء من هذه الشروط، فيجب عدم إنشاء حساب أو استخدام الخدمات التي تتطلب الموافقة عليها.": "If you do not agree with any part of these terms, you should not create an account or use services that require acceptance of them.",
  "يجب تقديم بيانات صحيحة ومحدثة عند إنشاء الحساب، ويكون المستخدم مسؤولًا عن المحافظة على سرية بيانات الدخول الخاصة به.": "You must provide accurate, up-to-date information when creating an account and are responsible for keeping your sign-in details confidential.",
  "الحساب شخصي ولا يجوز مشاركة كلمة المرور أو منح شخص آخر حق استخدام الحساب أو مشاهدة المحتوى المدفوع من خلاله.": "Your account is personal. You may not share your password or allow another person to use your account or access paid content through it.",
  "يحق للمنصة اتخاذ الإجراءات المناسبة عند وجود استخدام غير مصرح به أو مشاركة للحساب بما يحمي المحتوى وحقوق بقية المستخدمين.": "The platform may take appropriate action when unauthorized use or account sharing is detected in order to protect content and other users' rights.",
  "جميع المحاضرات والفيديوهات والمواد التعليمية والتصميمات والملفات والنصوص المرتبطة بالدورات مخصصة للاستخدام الشخصي والتعليمي للمستخدم المسجل.": "All lectures, videos, educational materials, designs, files and course-related text are provided for the registered user's personal educational use.",
  "لا يجوز نسخ المحتوى أو تسجيله أو إعادة نشره أو توزيعه أو بيعه أو مشاركته مع الآخرين بأي وسيلة دون تصريح كتابي مسبق من Masar Makers أو صاحب الحق.": "Content may not be copied, recorded, republished, distributed, sold or shared by any means without prior written permission from Masar Makers or the rights holder.",
  "الاشتراك يمنح حق الوصول إلى المحتوى وفق نوع الرحلة وحالة الاشتراك ومدة الإتاحة المعلنة، ولا ينقل ملكية المحتوى إلى المستخدم.": "Enrollment grants access according to the journey type, enrollment status and stated access period. It does not transfer ownership of the content to the user.",
  "جميع محتويات Masar Makers التعليمية مخصصة للاستخدام الشخصي للمستخدم المشترك فقط. وفي حال ثبوت قيام المستخدم بنسخ أو تسجيل أو تحميل أو إعادة نشر أو مشاركة أو تسريب أي محتوى خاص بالمنصة، كليًا أو جزئيًا، خارج المنصة أو إتاحته لأي شخص غير مصرح له بالوصول إليه، يحق لـ Masar Makers تعليق أو إنهاء حساب المستخدم وحظره نهائيًا من المنصة، وإلغاء وصوله إلى جميع الكورسات والرحلات والمحتويات المشترك بها، وليس فقط الكورس أو الرحلة التي تمت مشاركة محتواها، وذلك دون استحقاق استرداد الرسوم المدفوعة، مع احتفاظ Masar Makers بحقها في اتخاذ أي إجراءات أخرى يجيزها النظام. ويُعد قبول المستخدم لهذه الشروط إقرارًا منه بعلمه بهذه السياسة وموافقته عليها.": "All Masar Makers educational content is for the enrolled user’s personal use only. If a user is found to have copied, recorded, downloaded, republished, shared or leaked any platform content, in whole or in part, outside the platform or made it available to an unauthorized person, Masar Makers may suspend or terminate the user’s account, permanently block platform access, and revoke access to all enrolled courses, journeys and content—not only the course or journey whose content was shared—without a refund of paid fees, while retaining any additional rights permitted by applicable law. Acceptance of these terms confirms the user’s awareness of and agreement to this policy.",
  "بعض الرحلات تتطلب إرسال طلب اشتراك وموافقة الإدارة قبل تفعيل الوصول إلى المحتوى.": "Some journeys require an enrollment request and administrative approval before content access is activated.",
  "تظهر حالة الطلب داخل المنصة، وقد تكون قيد المراجعة أو مفعلة أو مرفوضة أو موقوفة أو منتهية وفق حالة الاشتراك.": "The request status appears on the platform and may be pending, active, rejected, suspended or expired depending on the enrollment state.",
  "تفاصيل السعر ومدة الوصول وما يشمله الاشتراك يجب الرجوع فيها إلى صفحة الرحلة أو العرض المعلن وقت التسجيل.": "For price, access duration and enrollment inclusions, refer to the journey page or the offer published at the time of registration.",
  "تخضع المدفوعات وسياسات الإلغاء والاسترداد للتفاصيل المعلنة للمستخدم قبل إتمام الشراء وللأنظمة واللوائح المطبقة على مقدم الخدمة.": "Payments, cancellations and refunds are subject to the details shown before purchase and the laws and regulations applicable to the service provider.",
  "إذا كان لأي رحلة أو عرض شروط خاصة تتعلق بالاسترداد أو مدة الوصول أو الخصومات، فتعد هذه الشروط الخاصة جزءًا مكملًا لهذه الشروط.": "If a journey or offer has special refund, access-duration or discount terms, those terms form an additional part of these Terms & Conditions.",
  "يجب التواصل مع إدارة المنصة عند وجود مشكلة متعلقة بالدفع أو التفعيل حتى تتم مراجعة الحالة.": "Contact platform administration if there is a payment or activation issue so the case can be reviewed.",
  "تصدر الشهادات وفق متطلبات كل رحلة وبعد استيفاء الشروط المحددة لها داخل المنصة.": "Certificates are issued according to each journey's requirements after the stated platform conditions are met.",
  "يتحمل المستخدم مسؤولية التأكد من صحة اسمه وبياناته، وبالأخص الاسم الإنجليزي المستخدم في الشهادة، قبل إصدارها.": "Users are responsible for confirming that their name and details, especially the English name used on the certificate, are correct before issuance.",
  "الشهادة توثق إتمام المتطلبات التعليمية المحددة للرحلة ولا تمثل ترخيصًا مهنيًا أو اعتمادًا حكوميًا ما لم يذكر خلاف ذلك صراحة.": "A certificate confirms completion of the journey's stated learning requirements. It is not a professional license or government accreditation unless explicitly stated otherwise.",
  "يجب أن تكون المشاريع والصور والمواد التي يرفعها المستخدم من أعماله أو مما يملك حق استخدامه ونشره.": "Projects, images and materials uploaded by users must be their own work or material they have the right to use and publish.",
  "يظل المستخدم مسؤولًا عن المحتوى الذي يرفعه وعن عدم انتهاكه حقوق الآخرين أو سرية جهات العمل أو العملاء.": "Users remain responsible for their uploaded content and for ensuring it does not violate others' rights or the confidentiality of employers or clients.",
  "بالموافقة على هذه الشروط والأحكام، يوافق المستخدم على منح Masar Makers الإذن بعرض واستخدام المشاريع والصور والأعمال التي يرفعها على المنصة لأغراض العرض والتسويق والتعريف بنتائج الرحلات التعليمية، دون الحاجة إلى الحصول على موافقة منفصلة لكل مرة يتم فيها الاستخدام.": "By accepting these Terms & Conditions, the user grants Masar Makers permission to display and use projects, images and work uploaded to the platform for presentation, marketing and showcasing learning-journey outcomes without requiring separate approval for each use.",
  "تستخدم بيانات المستخدم لتشغيل الحساب وتقديم الخدمات التعليمية وإدارة الاشتراكات والشهادات والمشاريع والإشعارات وتحسين تجربة المنصة.": "User data is used to operate accounts, provide educational services, manage enrollments, certificates, projects and notifications, and improve the platform experience.",
  "تلتزم المنصة بالتعامل مع البيانات الشخصية وفق سياسة الخصوصية والأنظمة المطبقة، ولا يعني قبول هذه الشروط منح إذن مفتوح لاستخدام البيانات خارج الأغراض الموضحة للمستخدم.": "The platform handles personal data according to the Privacy Policy and applicable regulations. Accepting these terms does not grant unrestricted permission to use data beyond the purposes explained to users.",
  "يحظر إساءة استخدام المنصة أو محاولة تجاوز صلاحيات الوصول أو الوصول إلى محتوى غير مصرح به أو التدخل في عمل النظام أو حسابات المستخدمين الآخرين.": "Misusing the platform, bypassing access permissions, accessing unauthorized content, or interfering with the system or other users' accounts is prohibited.",
  "يجب استخدام قنوات التواصل والمجتمع بصورة مهنية ومحترمة وعدم نشر محتوى مسيء أو غير قانوني أو مخالف لحقوق الآخرين.": "Communication and community channels must be used professionally and respectfully. Offensive, illegal or rights-infringing content must not be posted.",
  "يجوز تحديث هذه الشروط عند الحاجة لتطوير الخدمات أو الامتثال للمتطلبات النظامية، ويعرض تاريخ آخر تحديث في هذه الصفحة.": "These terms may be updated when needed to improve services or comply with regulatory requirements. The latest update date is shown on this page.",
  "عندما يكون التغيير جوهريًا، يمكن إشعار المستخدم داخل المنصة وطلب موافقة جديدة إذا كان ذلك مطلوبًا.": "When a change is material, users may be notified within the platform and asked for renewed consent when required.",

  // Privacy page
  "البيانات التي نجمعها": "Data We Collect",
  "لماذا نستخدم بياناتك؟": "Why We Use Your Data",
  "الأساس النظامي والموافقة": "Legal Basis & Consent",
  "مشاركة البيانات ومقدمو الخدمات": "Data Sharing & Service Providers",
  "حماية البيانات": "Data Protection",
  "مدة الاحتفاظ": "Retention Period",
  "حقوقك المتعلقة ببياناتك": "Your Data Rights",
  "المشاريع والصور التي يرفعها الطالب": "Student Projects & Uploaded Images",
  "التواصل والاستفسارات": "Contact & Questions",
  "توضح هذه السياسة أنواع البيانات التي تعالجها Masar Makers، والأغراض من استخدامها، وكيف نحميها، والحقوق المتعلقة بها.": "This policy explains the types of data Masar Makers processes, why it is used, how it is protected, and the rights connected to it.",
  "التزامنا بالوضوح": "Our Commitment to Clarity",
  "نهدف إلى جمع واستخدام البيانات بالقدر اللازم لتشغيل المنصة وتقديم الخدمة، مع توضيح الأغراض للمستخدم قبل أو عند جمع البيانات.": "We aim to collect and use only the data needed to operate the platform and provide the service, while explaining the purposes before or when data is collected.",
  "قرأت سياسة الخصوصية؟": "Finished Reading the Privacy Policy?",
  "يمكنك العودة إلى نموذج التسجيل واستكمال إنشاء حسابك.": "You can return to registration and complete your account creation.",
  "قد نجمع البيانات التي يقدمها المستخدم عند إنشاء الحساب أو تحديث ملفه، مثل الاسم، الاسم باللغة الإنجليزية، البريد الإلكتروني، رقم الهاتف، الدولة، المسمى الوظيفي، سنوات الخبرة والتخصص.": "We may collect data you provide when creating or updating your account, such as your name, English name, email address, phone number, country, job title, years of experience and specialty.",
  "كما قد نعالج بيانات مرتبطة باستخدام المنصة مثل الرحلات المشترك بها، التقدم في الدروس، الشهادات، الاستبيانات، المشاريع والصور التي يرفعها الطالب، والنقاط والإنجازات المرتبطة بحسابه.": "We may also process data related to platform use, including enrolled journeys, lesson progress, certificates, surveys, projects and images uploaded by the student, and account points and achievements.",
  "قد تجمع الأنظمة التقنية بيانات تشغيلية لازمة للأمان وتحسين الأداء، مثل معلومات الجلسة وسجلات الاستخدام الفنية، وفق الإعدادات والخدمات المستخدمة في المنصة.": "Technical systems may collect operational data needed for security and performance improvements, such as session information and technical usage logs, depending on platform settings and services.",
  "نستخدم البيانات لإنشاء الحساب وإدارته، وتفعيل الاشتراكات، وتقديم المحتوى التعليمي، وحفظ التقدم، وإصدار الشهادات، وإدارة المشاريع والاستبيانات والإشعارات، وتشغيل مزايا Masar Passport.": "We use data to create and manage accounts, activate enrollments, deliver educational content, save progress, issue certificates, manage projects, surveys and notifications, and operate Masar Passport features.",
  "قد نستخدم بيانات التواصل لإرسال رسائل ضرورية مرتبطة بالحساب، مثل تأكيد البريد، استعادة كلمة المرور، تفعيل الاشتراك، إصدار شهادة، أو إشعار متعلق بالخدمة.": "We may use contact information to send essential account-related messages such as email confirmation, password recovery, enrollment activation, certificate issuance or service notifications.",
  "قد تستخدم Masar Makers بعض بيانات المتدرب، مثل الاسم والدولة والمسمى الوظيفي، لأغراض العرض والتسويق المرتبطة بالمنصة، بما في ذلك عرض آراء المتدربين، ونماذج من مشاريعهم وأعمالهم وإنجازاتهم التعليمية.": "Masar Makers may use selected trainee information, such as name, country and job title, for platform-related presentation and marketing, including displaying trainee feedback, examples of projects and work, and educational achievements.",
  "تتم معالجة البيانات وفق الأغراض المعلنة وبالقدر اللازم لتقديم الخدمة والامتثال للمتطلبات النظامية المطبقة.": "Data is processed for the stated purposes and only to the extent needed to provide the service and comply with applicable legal requirements.",
  "الموافقة على الشروط والأحكام لا تعني موافقة مفتوحة على كل استخدام محتمل للبيانات؛ وقد نطلب موافقة منفصلة عند الحاجة.": "Accepting the Terms & Conditions does not constitute open-ended consent to every possible use of data; separate consent may be requested when needed.",
  "قد نستخدم مقدمي خدمات تقنيين لتشغيل أجزاء من المنصة مثل الاستضافة، المصادقة، إرسال البريد، تشغيل الفيديو أو التخزين، وذلك بالقدر اللازم لتقديم الخدمة.": "We may use technical service providers to operate parts of the platform, such as hosting, authentication, email delivery, video services or storage, only to the extent needed to provide the service.",
  "قد يتم الإفصاح عن البيانات عندما يكون ذلك مطلوبًا نظامًا أو لحماية الحقوق أو أمن المنصة أو المستخدمين، وبما يتوافق مع المتطلبات المطبقة.": "Data may be disclosed when legally required or when necessary to protect rights or the security of the platform or its users, in accordance with applicable requirements.",
  "قد تتم معالجة بيانات الحساب وسجلات الاستخدام والبيانات التقنية المتاحة للمنصة بالقدر اللازم لحماية المحتوى التعليمي، والتحقق من حالات الوصول أو المشاركة غير المصرح بها، ومنع إساءة استخدام المنصة، وإنفاذ الشروط والأحكام. وفي حال ثبوت مخالفة شروط حماية المحتوى، يجوز اتخاذ الإجراءات الموضحة في الشروط والأحكام، بما في ذلك تعليق أو إنهاء الحساب وإلغاء صلاحية الوصول إلى كل المحتوى المشترك به، وفق الأنظمة المطبقة.": "Account data, usage logs and technical data available to the platform may be processed as needed to protect educational content, investigate unauthorized access or sharing, prevent platform misuse, and enforce the Terms & Conditions. If a content-protection violation is established, the actions described in the Terms & Conditions may be taken, including account suspension or termination and revocation of access to enrolled content, subject to applicable law.",
  "لا يتم بيع البيانات الشخصية للمستخدمين.": "Users' personal data is not sold.",
  "نتخذ إجراءات تنظيمية وتقنية معقولة لحماية البيانات من الوصول غير المصرح به أو التعديل أو الفقد أو الإفصاح غير المشروع.": "We take reasonable organizational and technical measures to protect data from unauthorized access, alteration, loss or unlawful disclosure.",
  "رغم ذلك لا يمكن ضمان الأمان المطلق لأي خدمة إلكترونية، لذلك نراجع الضوابط والإعدادات بصورة مستمرة ونقيد الوصول إلى البيانات بحسب الحاجة.": "No online service can guarantee absolute security, so we continuously review controls and settings and restrict data access according to need.",
  "نحتفظ بالبيانات للمدة اللازمة لتقديم الخدمات، وحفظ السجلات التعليمية والشهادات، والوفاء بالالتزامات النظامية، ثم نتعامل معها وفق سياسة الاحتفاظ المعتمدة.": "We retain data for as long as needed to provide services, preserve learning records and certificates, and meet legal obligations, then handle it according to the applicable retention policy.",
  "قد تختلف مدة الاحتفاظ بحسب نوع البيانات والغرض منها والمتطلبات النظامية ذات العلاقة.": "Retention periods may vary depending on the data type, purpose and relevant legal requirements.",
  "يمكن للمستخدم طلب الاطلاع على بياناته أو تصحيحها أو تحديثها من خلال الأدوات المتاحة في المنصة أو عبر التواصل معنا، وفق الحدود والإجراءات النظامية المطبقة.": "Users may request access to, correction of or updates to their data through available platform tools or by contacting us, subject to applicable legal procedures and limits.",
  "قد نحتاج إلى التحقق من هوية مقدم الطلب قبل تنفيذ طلب متعلق بالبيانات لحماية خصوصية الحساب.": "We may need to verify the requester's identity before processing a data-related request in order to protect account privacy.",
  "المشاريع والصور المرفوعة ترتبط بحساب الطالب وتستخدم لعرض أعماله داخل المنصة وتشغيل المزايا المرتبطة بالمشروعات والإنجازات.": "Uploaded projects and images are linked to the student's account and are used to display work on the platform and operate project and achievement features.",
  "يعتبر مجرد رفع المشروع موافقة تلقائية على استخدامه في الإعلانات العامة.": "Uploading a project constitutes consent for it to be used in public promotional materials.",
  "يجب على الطالب عدم رفع محتوى يتضمن بيانات سرية أو مواد لا يملك حق مشاركتها.": "Students must not upload confidential data or material they do not have the right to share.",
  "إذا كان لديك استفسار عن بياناتك أو هذه السياسة أو رغبت في ممارسة حق متعلق بالخصوصية، يمكنك التواصل مع إدارة Masar Makers عبر قنوات التواصل المعلنة في المنصة.": "If you have questions about your data or this policy, or want to exercise a privacy-related right, you can contact Masar Makers administration through the contact channels published on the platform.",
  "قد نحدث هذه السياسة عند تطوير الخدمة أو تغير المتطلبات النظامية، وسيظهر تاريخ آخر تحديث في هذه الصفحة.": "We may update this policy as the service evolves or legal requirements change. The latest update date will appear on this page.",

  // Profile
  "حسابي": "My Account",
  "بياناتي": "My Profile",
  "حدّث بياناتك الشخصية والمهنية المستخدمة داخل المنصة والشهادات.": "Update the personal and professional information used across the platform and certificates.",
  "المعلومات الأساسية": "Basic Information",
  "يمكنك تعديل بياناتك وحفظها في أي وقت.": "You can update and save your information at any time.",
  "يظهر بهذا الشكل في الشهادات الجديدة.": "This is how your name will appear on new certificates.",
  "لتغيير البريد سنستخدم إجراء تأكيد منفصل لاحقًا.": "Changing your email will use a separate confirmation process later.",
  "الاسم الإنجليزي المحدّث سيُستخدم في الشهادات التي تصدر بعد التعديل.": "Your updated English name will be used on certificates issued after this change.",
  "حفظ التعديلات": "Save Changes",
  "جاري الحفظ...": "Saving...",
  "جاري تحميل بياناتك...": "Loading your profile...",
  "تم حفظ بياناتك بنجاح.": "Your information was saved successfully.",
  "تعذر حفظ البيانات. حاولي مرة أخرى.": "Unable to save your information. Please try again.",
  "تعذر تحميل بيانات الحساب حاليًا. حاولي مرة أخرى.": "Unable to load your account information right now. Please try again.",

  // Catalog / career paths / course data
  "هندسة وتصميم الطرق": "Road Design Engineering",
  "مسار مهني متكامل لتصميم وإخراج مشروعات الطرق.": "An integrated professional path for road design and project deliverables.",
  "مسار مهني متكامل للتحليل والنمذجة والدراسات المرورية.": "An integrated professional path for traffic analysis, modeling and studies.",
  "التصميم الاحترافي للطرق باستخدام Civil 3D.": "Professional road design using Civil 3D.",
  "تصميم شبكات الطرق بسرعة ومنهجية باستخدام CSD.": "Design road networks efficiently and systematically using CSD.",
  "استخراج وتسليم لوحات مشروعات الطرق بسرعة واحترافية.": "Produce and deliver road-project drawings quickly and professionally.",
  "تحليل حركة المركبات ومسارات الدوران والتحقق من التصميم.": "Analyze vehicle movements and swept paths and verify the design.",
  "تحويل تصميم الطرق إلى نموذج ثلاثي الأبعاد احترافي.": "Transform road designs into professional 3D models.",
  "تحليل التقاطعات ومستويات الخدمة باستخدام SIDRA.": "Analyze intersections and levels of service using SIDRA.",
  "تحليل وتنسيق الإشارات المرورية باستخدام Synchro.": "Analyze and coordinate traffic signals using Synchro.",
  "المحاكاة المرورية المجهرية باستخدام VISSIM.": "Microscopic traffic simulation using VISSIM.",
  "إعداد دراسات التأثير المروري للمشروعات.": "Prepare Traffic Impact Studies for projects.",
  "أساسيات ومنهجيات هندسة المرور والتحليل التشغيلي.": "Traffic engineering fundamentals, methodologies and operational analysis.",
  "محطات تعليمية": "Learning Stations",
  "رحلات تدريبية": "Training Journeys",
  "محتوى تدريبي": "Training Content",
  "المستوى": "Level",
  "احترافي": "Professional",
  "ساعة": "Hours",
  "ساعات تدريبية": "Training Hours",
  "رحلة": "Journey",
  "رحلات": "Journeys",
  "رحلة تعليمية متكاملة تقودك إلى مستوى احترافي.": "An integrated learning journey that leads you to a professional level.",
  "اختر طريقة التعلم": "Choose How to Learn",
  "نتائج الرحلة": "Journey Results",
  "عدد الرحلات": "Journeys",
  "إجمالي المحاضرات": "Total Lectures",
  "إجمالي الساعات": "Total Hours",
  "مستوى الرحلة": "Journey Level",
  "أساسيات": "Fundamentals",
  "إحصائيات الرحلة التعليمية": "Learning Journey Statistics",
  "الرحلة المتكاملة": "Integrated Journey",
  "تشمل رحلة الأساسيات والرحلة المتقدمة": "Includes the Fundamentals and Advanced journeys",
  "رحلة الأساسيات": "Fundamentals Journey",
  "الرحلة المتقدمة": "Advanced Journey",
  "قريبًا": "Coming Soon",
  "سيتم إضافة المحاضرات قريبًا.": "Lectures will be added soon.",
  "سيتم إضافة محاور رحلة الاحتراف قريبًا.": "Professional journey topics will be added soon.",
  "رحلة الاحتراف المتكاملة": "Integrated Professional Journey",
  "المنهج الكامل الذي ينقلك من الأساسيات إلى التطبيق الاحترافي.": "The complete curriculum that takes you from fundamentals to professional application.",
  "رحلة اليوم الواحد": "One-Day Journey",
  "رحلات اليوم الواحد": "One-Day Journeys",
  "الرحلات المجانية": "Free Journeys",
  "آراء المتدربين": "Student Reviews",
  "المشاريع": "Projects",
  "الشهادات": "Certificates",
  "الاستبيانات": "Surveys",
  "النتائج": "Results",
  "إلى ماذا سأصل؟": "What Will I Achieve?",
  "الهدايا والملفات": "Gifts & Files",
  "أقسام الشاشة": "Screen Sections",
  "العمود الأول": "First Column",
  "العمود الثاني": "Second Column",
  "اشترك الآن": "Enroll Now",
  "عرض": "View",
  "فتح الفيديو": "Open Video",
  "غلاف الفيديو": "Video Thumbnail",
  "تكبير الصورة": "Enlarge Image",
  "اضغط لتكبير الصورة": "Click to enlarge image",
  "معاينة الصورة بالحجم الكبير": "Large Image Preview",
  "إغلاق الصورة": "Close image",
  "وضع تحرير الصفحة": "Page Edit Mode",
  "أدوات الإدارة ظاهرة لك فقط، مع الحفاظ على شكل صفحة الطالب.": "Admin tools are visible only to you while preserving the student-page appearance.",
  "جارٍ ترتيب الأزرار...": "Reordering buttons...",
  "معاينة مباشرة": "Live Preview",
  "عنوان عمود طريقة التعلم": "Learning-method column title",
  "عنوان عمود نتائج الرحلة": "Journey-results column title",
  "إضافة زر جديد": "Add New Button",
  "تعذر تغيير ترتيب الأزرار.": "Unable to change button order.",
  "تم حفظ الشاشة بنجاح.": "Screen saved successfully.",
  "حدث خطأ غير معروف أثناء الحفظ.": "An unknown error occurred while saving.",
  "إضافة زر": "Add Button",
  "تعديل عنوان العمود": "Edit Column Title",

  // Course actions
  "رحلة الاحتراف": "Professional Journey",
  "رحلة مجانية": "Free Journey",
  "شاهد الآن": "Watch Now",
  "ابدأ الرحلة": "Start Journey",
  "استكمل الرحلة": "Continue Journey",
  "شاهد مرة أخرى": "Watch Again",
  "الرحلة مكتملة": "Journey Completed",
  "طلب الاشتراك قيد المراجعة": "Enrollment Request Under Review",
  "أعد إرسال طلب الاشتراك": "Resend Enrollment Request",
  "جارٍ إعادة إرسال الطلب...": "Resending request...",
  "طلب إعادة تفعيل الاشتراك": "Request Reactivation",
  "جارٍ إرسال طلب إعادة التفعيل...": "Sending reactivation request...",
  "انتهى الاشتراك": "Enrollment Expired",
  "جارٍ إرسال الطلب...": "Sending request...",
  "تعذر إرسال طلب الاشتراك.": "Unable to send the enrollment request.",
  "تمت إضافة الرحلة المجانية إلى رحلاتي.": "The free journey was added to My Learning Journeys.",
  "اشتراكك مفعّل بالفعل.": "Your enrollment is already active.",
  "تم إرسال طلب إعادة تفعيل الاشتراك، وهو الآن قيد مراجعة الإدارة.": "Your reactivation request was sent and is now under administrative review.",
  "تم تسجيل طلبك بنجاح، وسيتم فتح واتساب لاستكمال إجراءات التسجيل والدفع.": "Your request was submitted successfully. WhatsApp will open so you can complete registration and payment.",
  "تم تسجيل طلبك بنجاح. سيظهر الطلب لدى الإدارة لتفعيله.": "Your request was submitted successfully and will appear for administration to activate.",
  "تم إرسال طلب الاشتراك من المنصة، وأرغب في استكمال إجراءات الدفع.": "I submitted the enrollment request through the platform and would like to complete payment.",
  "السلام عليكم،": "Hello,",
  "أرغب في الاشتراك في منصة Masar Makers.": "I would like to enroll on the Masar Makers platform.",

  // Coming soon journey
  "لم يتم ربط هذه الرحلة بقاعدة البيانات بعد.": "This journey has not been linked to the database yet.",
  "يجب تسجيل الدخول أولًا لتسجيل اهتمامك.": "You need to sign in first to register your interest.",
  "اهتمامك بهذه الرحلة مسجل بالفعل، وسيتم إشعارك عند توفر أي تحديثات.": "Your interest in this journey is already registered. You'll be notified when updates are available.",
  "اهتمامك بهذه الرحلة مسجل بالفعل.": "Your interest in this journey is already registered.",
  "تم تسجيل اهتمامك بالرحلة، وسيتم إشعارك فور توفرها أو وجود أخبار جديدة عنها.": "Your interest has been registered. You'll be notified as soon as the journey becomes available or new information is announced.",
  "تعذر تسجيل اهتمامك حاليًا.": "Unable to register your interest right now.",
  "نعمل حاليًا على تجهيز هذه الرحلة لتقديمها بأفضل محتوى وتجربة تعليمية. سجّل اهتمامك ليصلك إشعار عند فتح التسجيل أو الإعلان عن أي تحديث جديد.": "We're currently preparing this journey to deliver the best possible content and learning experience. Register your interest to be notified when enrollment opens or new updates are announced.",
  "تم تسجيل اهتمامك": "Interest Registered",
  "مهتم بهذه الرحلة": "I'm Interested",
  "جاري تسجيل اهتمامك...": "Registering your interest...",

  // Dashboard / workspace
  "رحلاتي الاحترافية": "My Professional Journeys",
  "الخطوة التالية": "Next Step",
  "شهاداتي": "My Certificates",
  "استبياناتي": "My Surveys",
  "مشاريعي": "My Projects",
  "إنجازاتي": "My Achievements",
  "رحلاتي": "My Journeys",
  "ستظهر هنا الرحلات القصيرة التي اشتركت بها.": "Your enrolled short journeys will appear here.",
  "ابدأ من المحتوى المجاني المتاح لك.": "Start with the free content available to you.",
  "لا يوجد محتوى متاح حاليًا.": "No content is available right now.",
  "رحلتك الأولى في انتظارك": "Your First Journey Is Waiting",
  "اشترك في إحدى الرحلات لتظهر خريطة تقدمك المهنية هنا.": "Enroll in a journey to see your professional progress map here.",
  "مستواك الحالي": "Your Current Level",
  "المستوى التالي": "Next Level",
  "وصلت إلى أعلى مستوى": "You've Reached the Highest Level",
  "التقدم للمستوى التالي": "Progress to the Next Level",
  "استمر في إنجاز المزيد": "Keep Achieving More",
  "إحصائيات رحلاتي التعليمية": "My Learning Journey Statistics",
  "إحصائيات الإنجاز": "Achievement Statistics",
  "نسبة الإنجاز في جميع الرحلات": "Completion rate across all journeys",
  "غير مشترك": "Not Enrolled",
  "مكتمل": "Completed",
  "محفوظ": "Saved",
  "بانتظار التقييم": "Awaiting Review",
  "اكتملت رحلة التقييم": "Review Journey Completed",
  "التقييم محفوظ": "Review Saved",
  "لا توجد رحلات متاحة للتقييم": "No Journeys Available for Review",
  "ستظهر هنا الرحلات التعليمية التي تم تفعيل اشتراكك بها حتى تتمكني من تقييمها وإكمال الاستبيان التفصيلي.": "Activated learning journeys will appear here so you can rate them and complete the detailed survey.",
  "جاري تحميل التقييمات...": "Loading reviews...",
  "مسارات استبياناتي": "My Survey Paths",
  "مسارات مشاريعي": "My Project Paths",
  "جاري تحميل معرض أعمالك...": "Loading your project portfolio...",
  "تعذر تحميل مشاريعك حاليًا. يرجى المحاولة مرة أخرى.": "Unable to load your projects right now. Please try again.",
  "لا توجد كورسات متاحة للمشاريع": "No Courses Available for Projects",
  "ستظهر هنا الكورسات التي تم تفعيل اشتراكك بها، وبعد ذلك يمكنك إضافة مشاريعك وأعمالك الهندسية.": "Courses with active enrollment will appear here, and you can then add your engineering projects and work.",
  "لا توجد مشاريع": "No Projects",
  "إضافة مشروع": "Add Project",
  "لا توجد مشاريع لهذه المحطة": "No Projects for This Station",
  "ابدأ ببناء معرض أعمالك الهندسية وأضف أول مشروع قمت بتنفيذه خلال هذا الكورس.": "Start building your engineering portfolio by adding the first project you completed during this course.",
  "رابط المشروع": "Project Link",
  "تعديل": "Edit",
  "حذف": "Delete",
  "حذف المشروع": "Delete Project",
  "سيتم حذف المشروع وجميع صوره نهائيًا، ولا يمكن التراجع عن هذه العملية.": "The project and all its images will be permanently deleted. This action cannot be undone.",
  "إلغاء": "Cancel",
  "حذف نهائي": "Delete Permanently",
  "جاري الحذف...": "Deleting...",
  "وصف المشروع": "Project Description",
  "لا يوجد وصف مضاف لهذا المشروع.": "No description has been added for this project.",
  "فتح رابط المشروع": "Open Project Link",
  "الصورة السابقة": "Previous image",
  "الصورة التالية": "Next image",
  "إغلاق": "Close",
  "اكتشف المحاضرات": "Explore Lectures",
  "اكتشف محاضرات اليوم الواحد": "Explore One-Day Lectures",
  "لا توجد رحلات يوم واحد بعد": "No One-Day Journeys Yet",
  "ستظهر هنا رحلات اليوم الواحد المتاحة لك.": "Your available one-day journeys will appear here.",
  "اختر المحطة لعرض رحلات اليوم الواحد": "Choose a station to view one-day journeys",
  "لا توجد رحلات يوم واحد في هذه المحطة": "There are no one-day journeys in this station",
  "ابدأ الآن": "Start Now",
  "استكمل": "Continue",
  "مشاهدة": "Watch",
  "لا توجد رحلات مجانية بعد": "No Free Journeys Yet",
  "ستظهر هنا المحاضرات التي حددتها الإدارة كرحلات مجانية.": "Lectures selected by administration as free journeys will appear here.",
  "اختر المحطة لعرض الرحلات المجانية": "Choose a station to view free journeys",
  "لا توجد رحلات مجانية في هذه المحطة": "There are no free journeys in this station",
  "إغلاق الفيديو": "Close Video",
  "محاضرات عامة": "General Lectures",
  "لا توجد محاضرات في هذا القسم.": "There are no lectures in this section.",

  // Certificates
  "لا توجد شهادات حتى الآن": "No Certificates Yet",
  "بعد إتمام أحد الكورسات وإصدار الشهادة من الإدارة، ستظهر شهادتك هنا تلقائيًا لتتمكني من معاينتها وتحميلها.": "After completing a course and receiving an issued certificate, it will automatically appear here for preview and download.",
  "إنجازاتك المعتمدة": "Your Verified Achievements",
  "جميع الشهادات التي أُصدرت لك من منصة Masar Makers.": "All certificates issued to you by Masar Makers.",
  "شهادة": "Certificate",
  "شهادات": "Certificates",
  "عرض الشهادة": "View Certificate",
  "جديدة": "New",
  "رقم الشهادة:": "Certificate No.:",
  "تحميل PDF": "Download PDF",
  "تعذر العثور على معاينة الشهادة.": "Unable to find the certificate preview.",
  "إغلاق المعاينة": "Close preview",

  // Success stories / projects
  "تقييمات المتدربين": "Student Reviews",
  "مشاريع المتدربين": "Student Projects",
  "لا توجد تقييمات منشورة لهذا الكورس بعد.": "No published reviews for this course yet.",
  "لا توجد مشاريع منشورة لهذا الكورس بعد.": "No published projects for this course yet.",
  "عرض المشروع": "View Project",
  "أحد متدربي Masar Makers": "A Masar Makers Student",

  // Passport
  "الاشتراك في رحلة احتراف": "Enroll in a Professional Journey",
  "إكمال رحلة احتراف": "Complete a Professional Journey",
  "الاشتراك في رحلة اليوم الواحد": "Enroll in a One-Day Journey",
  "مشاهدة رحلة مجانية": "Watch a Free Journey",
  "إكمال التقييم": "Complete a Review",
  "رفع مشروع": "Upload a Project",
  "مشروع مميز": "Featured Project",
  "دعوة صديق": "Refer a Friend",
  "بطاقات Masar Passport": "Masar Passport Cards",
  "بطاقة إنجازاتك المهنية": "Professional Achievements Card",
  "مستواك ونقاطك الحالية": "Your current level and points",
  "بطاقة المكافآت": "Rewards Card",
  "تقدمك نحو المكافآت": "Your progress toward rewards",
  "طرق زيادة النقاط": "Ways to Earn More Points",
  "كيف تجمع نقاطًا أكثر": "How to earn more points",
  "8 طرق": "8 Ways",

  // Misc status / buttons
  "و": "and",
  "تحميل": "Download",
  "حفظ": "Save",
  "التالي": "Next",
  "السابق": "Previous",
  "تم": "Done",
  "نعم": "Yes",
  "لا": "No",
  "بحث": "Search",
  "إرسال": "Send",
  "إضافة": "Add",
  "تأكيد": "Confirm",
};

const phraseEnglish: Array<[string, string]> = [
  ["رحلة الاحتراف المتكاملة", "Integrated Professional Journey"],
  ["رحلة الاحتراف", "Professional Journey"],
  ["رحلة الأساسيات", "Fundamentals Journey"],
  ["الرحلة المتقدمة", "Advanced Journey"],
  ["رحلة اليوم الواحد", "One-Day Journey"],
  ["الرحلات المجانية", "Free Journeys"],
  ["المسارات المهنية", "Career Paths"],
  ["ساعات تدريبية", "Training Hours"],
  ["محاضرات مكتملة", "completed lectures"],
  ["محاضرات", "lectures"],
  ["محاضرة", "lecture"],
  ["مشاريع", "projects"],
  ["مشروع", "project"],
  ["شهادات", "certificates"],
  ["شهادة", "certificate"],
  ["محطات", "stations"],
  ["رحلات", "journeys"],
  ["نقطة متبقية", "points remaining"],
  ["نقطة", "points"],
  ["صور", "images"],
  ["مكتملة", "completed"],
  ["غير مشترك", "not enrolled"],
  ["قيد المراجعة", "under review"],
  ["قيد التجهيز", "being prepared"],
];

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function preserveOuterWhitespace(source: string, replacement: string) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${replacement}${trailing}`;
}

function translatePattern(normalized: string): string | null {
  let match: RegExpMatchArray | null;

  match = normalized.match(/^(\d+)\.\s+(.+)$/);
  if (match) {
    const translatedTitle = translateUiText(match[2], "en");
    if (!/[\u0600-\u06FF]/.test(translatedTitle)) {
      return `${match[1]}. ${translatedTitle}`;
    }
  }

  match = normalized.match(/^تعذر تحميل بيانات الحساب:\s*(.+)$/);
  if (match) return `Unable to load account information: ${match[1]}`;

  match = normalized.match(/^المستوى التالي:\s*(.+)$/);
  if (match) return `Next Level: ${match[1]}`;

  match = normalized.match(/^رقم الشهادة:\s*(.+)$/);
  if (match) return `Certificate No.: ${match[1]}`;

  match = normalized.match(/^(\d+)\s+من\s+(\d+)\s+محاضرات مكتملة$/);
  if (match) return `${match[1]} of ${match[2]} lectures completed`;

  match = normalized.match(/^(\d+)\s+من\s+(\d+)\s+رحلات$/);
  if (match) return `${match[1]} of ${match[2]} journeys`;

  match = normalized.match(/^(\d+)\s+من\s+(\d+)\s+مكتملة$/);
  if (match) return `${match[1]} of ${match[2]} completed`;

  match = normalized.match(/^(\d+)\s+محاضرات?$/);
  if (match) return `${match[1]} ${Number(match[1]) === 1 ? "lecture" : "lectures"}`;

  match = normalized.match(/^(\d+)\s+رحلات?$/);
  if (match) return `${match[1]} ${Number(match[1]) === 1 ? "journey" : "journeys"}`;

  match = normalized.match(/^(\d+)\s+محطات?$/);
  if (match) return `${match[1]} ${Number(match[1]) === 1 ? "station" : "stations"}`;

  match = normalized.match(/^(\d+)\s+مشاريع?$/);
  if (match) return `${match[1]} ${Number(match[1]) === 1 ? "project" : "projects"}`;

  match = normalized.match(/^(\d+)\s+صور$/);
  if (match) return `${match[1]} ${Number(match[1]) === 1 ? "image" : "images"}`;

  match = normalized.match(/^(\d+)\s+شهادات?$/);
  if (match) return `${match[1]} ${Number(match[1]) === 1 ? "certificate" : "certificates"}`;

  match = normalized.match(/^(\d+)\s+نقطة(?:\s+متبقية)?$/);
  if (match) {
    return normalized.includes("متبقية")
      ? `${match[1]} points remaining`
      : `${match[1]} points`;
  }

  match = normalized.match(/^رحلة احتراف\s+(.+)$/);
  if (match) return `${match[1]} Professional Journey`;

  match = normalized.match(/^تحميل\s+(.+)$/);
  if (match) return `Download ${match[1]}`;

  match = normalized.match(/^معاينة شهادة\s+(.+)$/);
  if (match) return `Preview ${match[1]} Certificate`;

  match = normalized.match(/^شهادة\s+(.+)$/);
  if (match) return `${match[1]} Certificate`;

  match = normalized.match(/^مسارات\s+(.+)$/);
  if (match) return `${match[1]} Paths`;

  return null;
}

/**
 * Translate Masar Makers interface text from Arabic to English.
 * User-generated/free-form content is intentionally left as authored unless
 * it exactly matches a known platform UI string.
 */
export function translateUiText(source: string, locale: MasarLocale): string {
  if (locale === "ar" || !/[\u0600-\u06FF]/.test(source)) {
    return source;
  }

  const normalized = normalize(source);
  if (!normalized) return source;

  const exact = exactEnglish[normalized];
  if (exact) return preserveOuterWhitespace(source, exact);

  const patterned = translatePattern(normalized);
  if (patterned) return preserveOuterWhitespace(source, patterned);

  let partial = normalized;
  for (const [ar, en] of phraseEnglish) {
    partial = partial.split(ar).join(en);
  }

  // Never return a half-translated sentence. If Arabic remains, keep the
  // original authored content so it is not corrupted.
  if (!/[\u0600-\u06FF]/.test(partial) && partial !== normalized) {
    return preserveOuterWhitespace(source, partial);
  }

  return source;
}
