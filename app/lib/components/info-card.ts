export const InfoCardHeader = (title: string, secondaryContent?: string | null) => {
  const secondary = `<h3 class="text-md text-gray-400 hover:text-gray-600 italic">
      ${secondaryContent}
    </h3>`;
  return `
    <div class="flex justify-between">
        <h2 class="text-xl">${title}</h2>
        ${secondaryContent ? secondary : ""}
    </div>
  `;
};

export const InfoCard = (children: string) => {
  return `
    <div class="flex flex-col bg-white p-4 border shadow-sm gap-4">
        ${children}
    </div>
  `;
};

export const InfoCardContent = (children: string) => {
  return `<div class="flex">${children}</div>`;
};

export const InfoCardColumn = (children: string) => {
  return `
    <div class="flex flex-col grow gap-2">
          ${children}
    </div>
  `;
};

export const InfoCardFooter = (children: string) => {
  return `
    <div class="border-t p-4 border-gray-200">
        <div class="flex justify-end">
          ${children}
        </div>
    </div>
  `;
};

export const InfoCardAttribute = (
  label: string,
  value: string | null,
  shouldDisplay: boolean = true,
) => {
  if (!shouldDisplay) {
    return "";
  }

  return `
        <div class="flex flex-col">
            <div class="text-gray-500 text-sm">${label.toUpperCase()}</div>
            <div class="text-md">${value}</div>
        </div>
    `;
};
