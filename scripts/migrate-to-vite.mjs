import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

function transform(content, opts) {
  let s = content;
  s = s.replace(/window\.BGG_DATA/g, "BGG_DATA");
  s = s.replace(/Object\.assign\(window,\s*\{[^}]*\}\);?\s*/gs, "");
  s = s.replace(/Object\.assign\(window,\s*\{[\s\S]*?\}\);?\s*/g, "");
  if (opts.reactHooks) {
    s = s.replace(/\bReact\.(useState|useEffect|useMemo|useCallback|useRef|useContext|createContext|createElement|Fragment)\b/g, (_, m) => {
      const map = { createElement: "createElement", Fragment: "Fragment" };
      return map[m] || m;
    });
  }
  return s;
}

// data.js
let data = fs.readFileSync(path.join(root, "data.js"), "utf8");
data = data.replace(/window\.BGG_DATA\s*=\s*\(\(\)\s*=>\s*\{/, "export const BGG_DATA = (() => {");
data = data.replace(
  /servico: window\.BGG_DATA\?\.serviceTypes \? "" :/,
  'servico: ""'
);
fs.writeFileSync(path.join(root, "src/data/bggData.js"), data);

const uiImports = `import React, { useEffect, useState, useCallback, useContext, createContext } from "react";\n\n`;
let ui = fs.readFileSync(path.join(root, "ui.jsx"), "utf8");
ui = transform(ui, { reactHooks: true });
ui = ui.replace(/^\/\/ ={5,}[\s\S]*?={5,}\n\n/, "");
ui = uiImports + ui + `
export {
  Icon, Button, Field, Input, Textarea, Select, Checkbox, StatusBadge,
  Modal, ToastProvider, useToast, useConfirm, fmtBRL, Brand, STATUS_TONE,
};
`;
fs.writeFileSync(path.join(root, "src/components/ui/index.jsx"), ui);

const tweaksImports = `import React, { useState, useEffect, useCallback, useRef } from "react";\n\n`;
let tweaks = fs.readFileSync(path.join(root, "tweaks-panel.jsx"), "utf8");
tweaks = transform(tweaks, { reactHooks: true });
tweaks = tweaksImports + tweaks + `
export {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
};
`;
fs.writeFileSync(path.join(root, "src/components/tweaks/TweaksPanel.jsx"), tweaks);

const pageMap = [
  ["auth.jsx", "src/pages/auth.jsx", `import React, { useState, useMemo } from "react";
import { Button, Field, Input, Checkbox, Brand, Icon } from "../components/ui";

`],
  ["chrome.jsx", "src/components/layout/Chrome.jsx", `import React, { Fragment } from "react";
import { Icon, Brand } from "../ui";

`],
  ["dashboard.jsx", "src/pages/Dashboard.jsx", `import React, { Fragment, createElement } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, StatusBadge, fmtBRL } from "../components/ui";

`],
  ["tasks.jsx", "src/pages/Tasks.jsx", `import React, { useState, useEffect } from "react";
import { BGG_DATA } from "../data/bggData";
import {
  Button, Icon, Field, Input, Select, StatusBadge, Modal, fmtBRL,
} from "../components/ui";

`],
  ["task-modals.jsx", "src/components/modals/TaskModals.jsx", `import React, { useState, useEffect } from "react";
import { BGG_DATA } from "../../data/bggData";
import { Button, Icon, Field, Input, Select, Checkbox, Modal } from "../ui";

`],
  ["chats.jsx", "src/pages/Chats.jsx", `import React, { useState, useEffect, Fragment } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Modal } from "../components/ui";

`],
  ["calendar.jsx", "src/pages/Calendar.jsx", `import React, { useState, Fragment } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Modal } from "../components/ui";

`],
  ["customers.jsx", "src/pages/Customers.jsx", `import React, { useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Modal, fmtBRL } from "../components/ui";

`],
  ["technicians.jsx", "src/pages/Technicians.jsx", `import React, { useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Modal, StatusBadge } from "../components/ui";

`],
  ["quotes.jsx", "src/pages/Quotes.jsx", `import React, { useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Modal, StatusBadge, fmtBRL } from "../components/ui";

`],
];

for (const [src, dest, header] of pageMap) {
  let content = fs.readFileSync(path.join(root, src), "utf8");
  content = transform(content, { reactHooks: true });
  content = content.replace(/^\/\/ ={5,}[\s\S]*?={5,}\n\n/, "");
  const exportMatch = content.match(/function (\w+)/g);
  const names = [...new Set((exportMatch || []).map((m) => m.replace("function ", "")))];
  if (names.length) {
    content += `\nexport { ${names.join(", ")} };\n`;
  }
  fs.writeFileSync(path.join(root, dest), header + content);
}

// app.jsx -> App.jsx
let app = fs.readFileSync(path.join(root, "app.jsx"), "utf8");
app = transform(app, { reactHooks: true });
app = app.replace(/const root = ReactDOM\.createRoot[\s\S]*$/m, "");
app = app.replace(/^\/\/ ={5,}[\s\S]*?={5,}\n\n/, "");
const appHeader = `import React, { useState } from "react";
import { BGG_DATA } from "./data/bggData";
import { ToastProvider, useToast, useConfirm, Button, Icon } from "./components/ui";
import { useTweaks, TweaksPanel, TweakSection, TweakToggle } from "./components/tweaks/TweaksPanel";
import { LoginScreen, RegisterScreen, ForgotScreen, ResetScreen } from "./pages/auth";
import { Sidebar, TopBar } from "./components/layout/Chrome";
import { DashboardPage } from "./pages/Dashboard";
import { TasksPage, TaskDetail } from "./pages/Tasks";
import { AssignTechModal, ScheduleModal, CreateTaskModal } from "./components/modals/TaskModals";
import { ChatsPage } from "./pages/Chats";
import { CalendarPage } from "./pages/Calendar";
import { CustomersPage } from "./pages/Customers";
import { TechniciansPage } from "./pages/Technicians";
import { QuotesPage } from "./pages/Quotes";

`;
app = appHeader + app + "\nexport default App;\n";
fs.writeFileSync(path.join(root, "src/App.jsx"), app);

console.log("Migration script done.");
