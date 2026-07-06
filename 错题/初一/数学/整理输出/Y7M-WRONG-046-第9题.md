# Y7M-WRONG-046 第9题

原图：`Y7M-WRONG-046.jpg`

## 题目

设一个三位正整数 $\overline{abc}$ 可表示为：

$$
\overline{abc}=100a+10b+c
$$

探索 $\overline{abc}$ 除以 $9$ 的余数与 $(a+b+c)$ 除以 $9$ 的余数关系。你有什么发现？试说明理由。

## 整理

因为：

$$
\overline{abc}=100a+10b+c
$$

又有：

$$
100a+10b+c=(99a+9b)+(a+b+c)
$$

其中 $99a+9b=9(11a+b)$，能被 $9$ 整除。

所以 $\overline{abc}$ 除以 $9$ 的余数，与 $a+b+c$ 除以 $9$ 的余数相同。

结论：

$$
\overline{abc}\equiv a+b+c\pmod 9
$$
