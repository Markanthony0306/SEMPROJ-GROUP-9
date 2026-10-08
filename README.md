# FitPulse logo + theme switch (React)

1. Copy these files into your project (for example src/components/brand/).
2. Import the CSS once, in main.jsx:  import "./components/brand/fitpulse-brand.css";
3. Wrap your app:
   import { ThemeProvider } from "./components/brand/useTheme";
   <ThemeProvider><App /></ThemeProvider>
4. Use the components anywhere:
   import Logo, { LogoMark } from "./components/brand/Logo";
   import ThemeToggle from "./components/brand/ThemeToggle";
   <Logo />            // login hero
   <Logo big />        // loading screen
   <LogoMark width={46} />   // side rail
   <ThemeToggle />

5. Add Fredoka in index.html <head>:
   <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap" rel="stylesheet">

6. Stop the wrong-theme flash on load: add this to index.html <head>, before your scripts:
   <script>
     try {
       var t = localStorage.getItem("fp-theme");
       var dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
       document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
     } catch (e) {}
   </script>
