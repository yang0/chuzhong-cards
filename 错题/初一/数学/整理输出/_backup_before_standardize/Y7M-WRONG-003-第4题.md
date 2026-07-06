# Y7M-WRONG-003 第 4 题：角平分线与平行线判定

来源：`Y7M-WRONG-003.jpg`

## 题目

如图，已知 $\angle 1=50^\circ$，$\angle 2=65^\circ$，$CD$ 平分 $\angle ECF$，请说明理由：$CD \parallel FG$。

![第4题重画图](Y7M-WRONG-003-第4题-figure.svg)

## 解题过程

因为 $\angle 1=50^\circ$，且 $\angle 1$ 与 $\angle ECF$ 组成邻补角，所以

$$
\angle ECF=180^\circ-\angle 1=130^\circ
$$

又因为 $CD$ 平分 $\angle ECF$，所以

$$
\angle DCF=\frac{1}{2}\angle ECF=65^\circ
$$

而 $\angle 2=65^\circ$，所以

$$
\angle DCF=\angle 2
$$

根据“同位角相等，两直线平行”，可得

$$
CD\parallel FG
$$

## 错因整理

原错点在于没有先求出被平分的大角 $\angle ECF$。这类题要按顺序走：先用邻补角求大角，再用角平分线求半角，最后用平行线判定。
