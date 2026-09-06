import re

with open("frontend/src/ui/pages/DuelsPage.jsx", "r") as f:
    content = f.read()

# Add import
if "LanguageSelect" not in content:
    content = content.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'\nimport LanguageSelect from '../components/LanguageSelect'")

# Replace selects
old_select_1 = """<select
                        value={duelForm.langFromCode}
                        onChange={e => setDuelForm(f => ({ ...f, langFromCode: e.target.value }))}
                        className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-600 outline-none"
                      >
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                      </select>"""
new_select_1 = """<div className="flex-1">
                        <LanguageSelect 
                          value={duelForm.langFromCode} 
                          onChange={val => setDuelForm(f => ({ ...f, langFromCode: val }))} 
                          languages={languages} 
                        />
                      </div>"""
content = content.replace(old_select_1, new_select_1)

old_select_2 = """<select
                        value={duelForm.langToCode}
                        onChange={e => setDuelForm(f => ({ ...f, langToCode: e.target.value }))}
                        className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-600 outline-none"
                      >
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                      </select>"""
new_select_2 = """<div className="flex-1">
                        <LanguageSelect 
                          value={duelForm.langToCode} 
                          onChange={val => setDuelForm(f => ({ ...f, langToCode: val }))} 
                          languages={languages} 
                        />
                      </div>"""
content = content.replace(old_select_2, new_select_2)

with open("frontend/src/ui/pages/DuelsPage.jsx", "w") as f:
    f.write(content)
