# 🎨 Frontend Design Guide

## 1. Colors

LIGHT MODE
Primary: #2563EB
Primary Hover: #1D4ED8
Background: #F9FAFB
Card: #FFFFFF
Border: #E5E7EB
Text Primary: #111827
Text Secondary: #6B7280
Success: #16A34A
Warning: #F59E0B
Error: #DC2626

DARK MODE
Primary: #3B82F6
Primary Hover: #60A5FA
Background: #0F172A
Card: #1E293B
Border: #334155
Text Primary: #F1F5F9
Text Secondary: #94A3B8
Success: #22C55E
Warning: #FBBF24
Error: #EF4444

Rules:
- One primary color only
- No random grays
- Status colors only for status
- Never use pure black (#000000)
- Never use pure white (#FFFFFF) in dark mode

## 2. Mobile First
- Design for 360–390px first (mobile first 99 % of the time i use in mobile )
- One column layout
- Minimum tap height: 44px
- Body text: 16px minimum

Breakpoints:
- Mobile: 0–640px
- Tablet: 640–1024px
- Desktop: 1024px+

## 3. Spacing (8px System)
Allowed spacing:
4, 8, 16, 24, 32, 48, 64

Rules:
- Section padding: 32px
- Card padding: 16px
- Gap between fields: 16px
- Gap between sections: 32px
- Never use random spacing

## 4. Typography
Font: Inter / Roboto / system-ui

Sizes:
H1: 28px
H2: 22px
H3: 18px
Body: 16px
Small: 14px

Line height:
Body: 1.5
Headings: 1.2

## 5. Components

Buttons:
- Radius: 8px
- Padding: 12px 16px
- Only ONE primary button per section

Cards:
- Radius: 12px
- Padding: 16px
- Border: 1px neutral

Forms:
- Label above input
- 8px label spacing
- 16px between fields
- Input height: 44px

Icons:
- Same style only
- Size: 20px or 24px

## Core Rules
- Consistency > creativity
- Reuse components
- Don’t invent new sizes
- Don’t invent new colors
- Keep it simple

## Pagination and Loading 
- handle pagination by loading more button on the bottm (not page load more button and load more)
- handle loading and error stats 


make shure in the mobile no scroll bars on the bottom feels like a native app

handle dark and white mode use api.tsx in the main folder for all api requests ... 


its in the telegram mini app so make it responsive for mobile  and also its a companie (Sign Companie Managemtn system so make it usable in all design and design update)