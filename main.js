// 站点的小交互：年份、复制链接
const yearEl = document.querySelector("#year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const copyBtn = document.querySelector("#copyEmail");
if (copyBtn) {
  const label = copyBtn.querySelector("span");
  const original = label.textContent;

  copyBtn.addEventListener("click", async () => {
    const text = copyBtn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 某些环境（如 file://）没有剪贴板权限，退回旧接口
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    label.textContent = "已复制";
    copyBtn.classList.add("done");
    setTimeout(() => {
      label.textContent = original;
      copyBtn.classList.remove("done");
    }, 1600);
  });
}
