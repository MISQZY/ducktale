/**
 * Fumadocs UI ships its own built-in strings (search, TOC labels, theme
 * switcher, pagination, etc.) separately from our next-intl catalogs in
 * `messages/*.json` — they're wired through `RootProvider`'s `i18n.translations`
 * prop (see src/app/[lang]/provider.tsx), keyed by the exact strings Fumadocs
 * uses internally (see fumadocs-ui/dist/.translations/keys.js). English is the
 * built-in default, so only Russian needs to be supplied here.
 */
export const FUMADOCS_RU_TRANSLATIONS: Partial<Record<string, string>> = {
  "Back to Home(404 page)": "На главную",
  "Choose a language(language switcher)": "Выбрать язык",
  "Choose a language(language switcher)(aria-label)": "Выбрать язык",
  "Close Banner(banner)(aria-label)": "Закрыть баннер",
  "Close Search(search dialog)(aria-label)": "Закрыть поиск",
  "Close Sidebar(sidebar)(aria-label)": "Закрыть боковую панель",
  "Collapse Sidebar(sidebar)(aria-label)": "Свернуть боковую панель",
  "Copied Text(code block)(aria-label)": "Скопировано",
  "Copy Anchor Link(heading anchor)(aria-label)": "Скопировать ссылку",
  "Copy Link(accordion)(aria-label)": "Скопировать ссылку",
  "Copy Markdown(page actions)": "Скопировать Markdown",
  "Copy Text(code block)(aria-label)": "Скопировать текст",
  "Dark(theme switcher)(aria-label)": "Тёмная",
  "Default(type table)": "По умолчанию",
  "Edit on GitHub(edit page)": "Редактировать на GitHub",
  "Last updated on(page footer)": "Обновлено",
  "Light(theme switcher)(aria-label)": "Светлая",
  "Next Page(pagination)": "Следующая страница",
  "No Headings(table of contents)": "Нет заголовков",
  "No results found(search dialog)": "Ничего не найдено",
  "On this page(table of contents)": "На этой странице",
  "Open Search(search trigger)(aria-label)": "Открыть поиск",
  "Open Sidebar(sidebar)(aria-label)": "Открыть боковую панель",
  "Open in ChatGPT(page actions)": "Открыть в ChatGPT",
  "Open in Claude(page actions)": "Открыть в Claude",
  "Open in Cursor(page actions)": "Открыть в Cursor",
  "Open in GitHub(page actions)": "Открыть в GitHub",
  "Open in Scira AI(page actions)": "Открыть в Scira AI",
  "Open(page actions)": "Открыть",
  "Page Not Found(404 page)": "Страница не найдена",
  "Parameters(type table)": "Параметры",
  "Previous Page(pagination)": "Предыдущая страница",
  "Prop(type table)": "Свойство",
  "Read {url}, I want to ask questions about it.(page actions)":
    "Прочитай {url}, я хочу задать вопросы об этом.",
  "Returns(type table)": "Возвращает",
  "Search(search dialog)": "Поиск",
  "Search(search trigger)": "Поиск",
  "System(theme switcher)(aria-label)": "Системная",
  "Table of Contents(inline table of contents)": "Содержание",
  "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 page)":
    "Возможно, страница была удалена, переименована или временно недоступна.",
  "Toggle Menu(mobile menu)(aria-label)": "Переключить меню",
  "Toggle Theme(theme switcher)(aria-label)": "Переключить тему",
  "Type(type table)": "Тип",
  "View as Markdown(page actions)": "Показать как Markdown",
  displayName: "Русский",
};
