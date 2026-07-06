# Y7M-WRONG-023 第 3 题（1）：分式乘法化简

来源：`Y7M-WRONG-023.jpg`

## 题目

计算：

$$
\frac{x^2-y^2}{xy}\cdot \frac{x}{x-y}
$$

## 正确解法

先把平方差分解：

$$
x^2-y^2=(x+y)(x-y)
$$

所以

$$
\frac{x^2-y^2}{xy}\cdot \frac{x}{x-y}
=\frac{(x+y)(x-y)}{xy}\cdot \frac{x}{x-y}
$$

约去公因式 $x$ 和 $x-y$：

$$
=\frac{x+y}{y}
$$

## 答案

$$
\frac{x+y}{y}
$$

## 错因整理

这类题不要急着约分，必须先把 $x^2-y^2$ 写成 $(x+y)(x-y)$。能约掉的是因式，不是单独看起来相同的某一项。
