# 3x3 Scoreboard — APK

تطبيق أندرويد (Kotlin) يشغّل سيرفر محلي (NanoHTTPD) ويخدم شاشة السكور بورد عبر WebView. جهاز واحد (جهاز الحكم) يشغّل التطبيق، وجهاز ثاني (شاشة العرض) يفتحه بمتصفح عادي على نفس الشبكة — بدون تنصيب أي شي عليه.

## البنية
```
3v3-scoreboard/
├── app/
│   ├── build.gradle
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/scoreboard3x3/app/
│       │   ├── MainActivity.kt      ← يشغّل السيرفر + يفتح WebView
│       │   └── LocalServer.kt       ← NanoHTTPD: يخدم web/ + /api/state
│       ├── res/values/strings.xml
│       └── assets/web/              ← نفس واجهة الويب (setup/control/display)
├── build.gradle
├── settings.gradle
├── gradle.properties
└── .github/workflows/build-apk.yml  ← يبني APK تلقائياً عند كل push
```

## كيف يشتغل التطبيق فعلياً
1. تفتح التطبيق على **جهاز الحكم** (اللي رح يثبّت عليه الـ APK).
2. التطبيق بيلاقي عنوان الشبكة المحلية لهذا الجهاز (مثلاً `192.168.1.5`)، ويشغّل سيرفر محلي على المنفذ `8080`، وبيفتح شاشة `control.html` جوا WebView.
3. من `control.html`، بيظهر رابط شاشة العرض (مثلاً `http://192.168.1.5:8080/display.html`) — تكتب هذا الرابط بمتصفح **الجهاز الثاني** (لازم يكون على نفس شبكة الواي فاي).
4. أي تغيير على شاشة التحكم (نقاط، فاولز، وقت) بينعكس مباشرة على شاشة العرض عن طريق `/api/state`.

## بناء الـ APK عبر GitHub Actions
1. ارفع هذا المجلد كامل كـ repo على GitHub.
2. بمجرد أي push على branch `main`، GitHub Actions بيبني APK تلقائياً (شغلة `Build APK` بتظهر بتبويب **Actions**).
3. بعد ما تخلص، افتح الـ workflow run → تحت **Artifacts** رح تلاقي `scoreboard-debug-apk` — نزّله وفكّه (zip)، وجوا رح تلاقي ملف `.apk` جاهز للتثبيت (فعّل "Install from unknown sources" على جهاز الأندرويد أول تثبيت).

يقدر أيضاً تشغّل البناء يدوياً من تبويب **Actions → Build APK → Run workflow** بدون الحاجة لـ push جديد (بفضل `workflow_dispatch`).

## ملاحظة عن أول build
بما إنه ما في تجربة محلية بـ Android Studio، أول build ممكن يحتاج تعديل بسيط بنسخ SDK/Gradle لو GitHub غيّرت افتراضياتها — إذا فشل الـ build، انسخ رسالة الخطأ من تبويب Actions ونصلحها بسرعة.
