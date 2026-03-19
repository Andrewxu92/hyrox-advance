# HYROX Advance Design System

**版本**: 1.1  
**最后更新**: 2026-03-19  
**基于**: Tailwind CSS + Framer Motion  
**参考**: [HYROX 官网](https://hyrox.com/elites/) 深色 + 红色强调风格

---

## 🎨 颜色系统

### 主色调 (Brand Colors - HYROX 官网风格)

| Token | Value | Usage |
|-------|-------|-------|
| `hyrox-red` | `#E31837` | 主强调色、品牌红、按钮、链接 |
| `hyrox-red-dark` | `#B8142C` | 按钮 hover、渐变深端 |
| `hyrox-red-light` | `#FF2D4A` | 高亮文字、徽章 |
| `hyrox-black` | `#0a0a0a` | 顶栏、页脚、深色块 |
| `hyrox-gray-mid` | `#1f1f1f` | 卡片、底栏、次级背景 |
| `gray-950` |  | 页面主背景 |
| `gray-800` / `gray-700` |  | 卡片、输入框背景 |
| `gray-400` / `gray-300` |  | 次级文本、图标 |

### 语义色 (Semantic Colors)

| Token | Value | Usage |
|-------|-------|-------|
| `green-500` | `#22c55e` | 成功状态、优势项 |
| `green-50` | `#f0fdf4` | 成功背景 |
| `red-500` | `#ef4444` | 错误状态、弱项 |
| `red-50` | `#fef2f2` | 错误背景 |
| `yellow-500` | `#eab308` | 警告状态 |
| `yellow-50` | `#fefce8` | 警告背景 |
| `blue-500` | `#3b82f6` | 信息状态、男性标识 |
| `blue-50` | `#eff6ff` | 信息背景 |
| `purple-500` | `#a855f7` | 精英级别 |
| `purple-50` | `#faf5ff` | 精英背景 |
| `pink-500` | `#ec4899` | 女性标识 |
| `pink-50` | `#fdf2f8` | 女性背景 |

### 渐变色 (Gradients)

```css
/* 主渐变 - HYROX 红 */
.gradient-primary: bg-gradient-to-r from-hyrox-red to-hyrox-red-dark
.gradient-blue: bg-gradient-to-r from-blue-500 to-cyan-500
.gradient-green: bg-gradient-to-r from-green-500 to-emerald-500
.gradient-dark: bg-gradient-to-br from-hyrox-black via-hyrox-gray-mid to-hyrox-black
```

### 对比度要求

- **正文文本**: 至少 4.5:1 (WCAG AA)
- **大文本** (>18px): 至少 3:1
- **UI 组件边框**: 至少 3:1

当前主色对比度：
- `hyrox-red` (#E31837) on `white`: 约 4.5:1 ✅
- `white` on `hyrox-red`: 约 4.5:1 ✅
- `gray-400` on `gray-950`: 满足可读性 ✅

---

## 📐 间距系统

### 基础单位

基于 4px 网格系统：

| Token | Value | Usage |
|-------|-------|-------|
| `1` | `4px` | 最小间距 |
| `2` | `8px` | 紧凑间距 |
| `3` | `12px` | 组件内间距 |
| `4` | `16px` | 标准间距 |
| `5` | `20px` | 中等间距 |
| `6` | `24px` | 标准组件间距 |
| `8` | `32px` | 大间距 |
| `10` | `40px` | 区块间距 |
| `12` | `48px` | 大区块间距 |
| `16` | `64px` | 超大间距 |

### 触摸间距

- **最小触摸目标**: 44×44px (`min-h-[44px] min-w-[44px]`)
- **触摸元素间距**: 至少 8px (`gap-2`)
- **可点击区域 padding**: 至少 12px (`p-3`)

---

## 🔤 字体系统

### 字体栈

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

### 字号规范

| 级别 | Class | Size | Line-height | Usage |
|------|-------|------|-------------|-------|
| H1 | `text-4xl` | 36px | 1.2 | 页面主标题 |
| H2 | `text-3xl` | 30px | 1.25 | 区块标题 |
| H3 | `text-2xl` | 24px | 1.3 | 卡片标题 |
| H4 | `text-xl` | 20px | 1.4 | 子标题 |
| Body | `text-base` | 16px | 1.5 | 正文 (默认) |
| Small | `text-sm` | 14px | 1.5 | 辅助文本 |
| XSmall | `text-xs` | 12px | 1.4 | 提示、标签 |

### 字重

- `font-normal` (400): 正文
- `font-medium` (500): 强调文本、按钮
- `font-semibold` (600): 标题
- `font-bold` (700): 主标题、重要数据

### 响应式字体

```tsx
// Mobile-first 响应式字体
className="text-lg sm:text-xl md:text-2xl"
className="text-sm sm:text-base"
className="text-xs sm:text-sm"
```

---

## 🧩 组件规范

### 按钮 (Buttons)

#### 主要按钮
```tsx
<button className="
  bg-gradient-to-r from-orange-500 to-red-500 
  text-white 
  px-6 py-3 
  rounded-xl 
  font-semibold 
  hover:shadow-xl 
  transition-all 
  duration-200
  min-h-[44px]
  active:scale-[0.98]
  touch-manipulation
">
  按钮文本
</button>
```

#### 次要按钮
```tsx
<button className="
  bg-gray-100 
  text-gray-700 
  px-4 py-2 
  rounded-lg 
  font-medium 
  hover:bg-gray-200 
  transition
  min-h-[44px]
  active:scale-[0.98]
">
  按钮文本
</button>
```

#### 图标按钮
```tsx
<button 
  className="p-3 min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-lg transition"
  aria-label="操作描述"
>
  <Icon className="w-5 h-5" />
</button>
```

#### 加载状态按钮
```tsx
<button disabled={loading} className="relative min-h-[44px]">
  <span className={loading ? 'opacity-0' : 'opacity-100'}>
    正常文本
  </span>
  {loading && (
    <span className="absolute inset-0 flex items-center justify-center gap-2">
      <LoadingSpinner size="sm" />
      处理中...
    </span>
  )}
</button>
```

### 输入框 (Inputs)

```tsx
<input
  type="text"
  className="
    w-full 
    px-4 py-3 
    border-2 border-gray-200 
    rounded-xl 
    focus:border-orange-500 
    focus:ring-2 focus:ring-orange-200 
    transition-all
    min-h-[44px]
    text-base
  "
  placeholder="请输入..."
/>
```

**焦点状态**: 必须显示清晰的焦点环 (`focus:ring-2`)

### 卡片 (Cards)

```tsx
<div className="
  bg-white 
  rounded-2xl 
  shadow-lg 
  p-6
  transition-all
  duration-300
  hover:shadow-xl
  hover:-translate-y-1
">
  卡片内容
</div>
```

### 模态框 (Modals)

```tsx
<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
    {/* 内容 */}
  </div>
</div>
```

### Toast 通知

位置：右上角 (`top-4 right-4`)  
最大宽度：`max-w-sm`  
持续时间：5 秒自动消失

---

## 📱 响应式断点

### Tailwind 默认断点

| 断点 | Min-width | 设备类型 |
|------|-----------|----------|
| `sm` | 640px | 大手机 / 小平板 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 笔记本 / 桌面 |
| `xl` | 1280px | 大桌面 |
| `2xl` | 1536px | 超大桌面 |

### 使用规范

```tsx
// Mobile-first 原则
<div className="
  flex-col           // 默认移动设备：垂直布局
  sm:flex-row        // ≥640px: 水平布局
  gap-4 
  sm:gap-6
">
  <div className="w-full sm:w-1/2" />
</div>

// 隐藏/显示
<div className="lg:hidden">仅移动设备可见</div>
<div className="hidden lg:block">仅桌面可见</div>

// 字体大小
<h1 className="text-2xl sm:text-3xl md:text-4xl">标题</h1>

// 间距
<div className="p-4 sm:p-6 md:p-8">内容</div>
```

### 移动优先检查清单

- [ ] 触摸目标 ≥ 44×44px
- [ ] 触摸间距 ≥ 8px
- [ ] 字体 ≥ 16px (正文)
- [ ] 横向滚动有指示
- [ ] 底部导航有 safe-area 支持
- [ ] 模态框可滚动 (max-h-[90vh])

---

## 🎬 动画规范

### 持续时间

| 类型 | Duration | Usage |
|------|----------|-------|
| 快速 | 150ms | 悬停状态、微小反馈 |
| 标准 | 200-300ms | 按钮点击、页面过渡 |
| 慢速 | 400-500ms | 大型元素进入、复杂动画 |

### 缓动函数

```css
/* 默认缓动 */
ease-out: cubic-bezier(0.25, 0.1, 0.25, 1)
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Framer Motion 配置

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ 
    duration: 0.3, 
    ease: 'easeOut' 
  }}
>
  内容
</motion.div>
```

### 动画类型

1. **页面过渡**: `opacity + y` 组合，300ms
2. **列表项进入**: stagger children，每项延迟 50-100ms
3. **悬停反馈**: `scale(1.02)` 或 `y(-4px)`
4. **点击反馈**: `scale(0.98)`

### 减少动画偏好

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## ♿ 无障碍访问

### 颜色对比度

- 正文文本：≥ 4.5:1
- 大文本 (≥18px 或 ≥14px bold)：≥ 3:1
- UI 组件/图标：≥ 3:1

### 键盘导航

- 所有交互元素必须可通过 Tab 键访问
- 焦点状态必须清晰可见 (`focus-visible: ring-2`)
- 模态框必须支持 Escape 关闭

### ARIA 标签

```tsx
// 图标按钮必须添加 aria-label
<button aria-label="关闭菜单">
  <X className="w-6 h-6" />
</button>

// 加载状态
<div role="status" aria-live="polite">
  <LoadingSpinner />
  <span>加载中...</span>
</div>

// 错误提示
<div role="alert" className="bg-red-50">
  错误信息
</div>
```

### 焦点管理

```css
/* 全局焦点样式 */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  @apply outline-none ring-2 ring-orange-500 ring-offset-2;
}
```

---

## 📊 图标系统

### 图标库

**Lucide React** - 统一使用此库

```tsx
import { Home, User, Activity, BarChart3 } from 'lucide-react';

<Home className="w-5 h-5" />
```

### 图标尺寸

| 场景 | Size | Class |
|------|------|-------|
| 内联小图标 | 16px | `w-4 h-4` |
| 按钮图标 | 20px | `w-5 h-5` |
| 卡片图标 | 24px | `w-6 h-6` |
| 展示图标 | 32px+ | `w-8 h-8` |

### 图标 + 文本间距

```tsx
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5" />
  <span>文本</span>
</div>
```

---

## 🖼️ 图片优化

### 格式

- 优先使用 **WebP** 或 **AVIF**
- 回退方案：`<picture>` 标签

```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="描述" loading="lazy" />
</picture>
```

### 懒加载

```tsx
<img 
  src="image.jpg" 
  alt="描述"
  loading="lazy"
  decoding="async"
/>
```

### 防止布局偏移 (CLS)

```tsx
// 始终指定宽高
<img 
  src="image.jpg" 
  width="800" 
  height="600"
  className="aspect-[4/3] object-cover"
/>
```

---

## 🧪 测试检查清单

### 视觉测试

- [ ] 所有页面在 320px 宽度下正常显示
- [ ] 所有页面在 1920px 宽度下正常显示
- [ ] 深色/浅色模式兼容 (如支持)
- [ ] 所有状态 (hover, active, focus, disabled) 可见

### 功能测试

- [ ] 所有按钮可点击且有反馈
- [ ] 所有表单可提交且有验证
- [ ] 所有加载状态有指示
- [ ] 所有错误状态有提示

### 无障碍测试

- [ ] 键盘 Tab 导航完整
- [ ] 屏幕阅读器可读
- [ ] 颜色对比度达标
- [ ] 减少动画偏好支持

### 性能测试

- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] 图片已优化

---

## 📝 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-03-10 | 初始版本，基于现有代码提取规范 |
