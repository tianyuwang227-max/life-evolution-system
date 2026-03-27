export const expenseCategories = ["饮食", "娱乐", "学习", "交通", "其他"];
export const incomeCategory = "收入";

export const moodOptions = [
  { value: 1, label: "很低" },
  { value: 2, label: "低" },
  { value: 3, label: "一般" },
  { value: 4, label: "好" },
  { value: 5, label: "很棒" },
];

export const procrastinationOptions = [
  { value: 0, label: "无" },
  { value: 1, label: "轻微" },
  { value: 2, label: "明显" },
  { value: 3, label: "严重" },
];

export const exerciseMetMap: Record<string, number> = {
  "力量训练": 6,
  "快走": 3.5,
  "慢跑": 7,
  "跑步": 8.5,
  "瑜伽": 3,
  "跳绳": 12,
  "骑行": 6.5,
  "游泳": 8,
  "HIIT": 10,
  "拉伸": 2.5,
};

export const exerciseTypeOptions = Object.keys(exerciseMetMap);
export const defaultExerciseMet = 5;
