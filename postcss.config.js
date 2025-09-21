export default {
  plugins: {
    // Tailwind CSS
    tailwindcss: {},
    
    // Autoprefixer - 自動添加瀏覽器前綴
    autoprefixer: {},
    
    // CSS Nano - 生產環境壓縮 CSS
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: [
          'default',
          {
            // 保留重要註釋
            discardComments: {
              removeAll: false,
            },
            // 優化規則
            normalizeWhitespace: true,
            colormin: true,
            minifySelectors: true,
            minifyParams: true,
            minifyFontValues: true,
            // 保持一定的可讀性
            reduceIdents: false,
            zindex: false,
          },
        ],
      },
    } : {}),
  },
}