# Y7M-WRONG-001 第 7 题：两块三角尺的角相等

来源：`Y7M-WRONG-001.jpg`

## 题目

如图，将两块三角尺的直角顶点重合，各边的交点分别为 $F,G,H$。

![第7题重画图](Y7M-WRONG-001-第7题-figure.svg)

请将下表补充完整，并思考：这些角相等的理由都一样吗？

| 序号 | ① | ② | ③ | ④ | ⑤ |
|---|---|---|---|---|---|
| 角 | $\angle AHD$ | $\angle AGD$ | $\angle BFC$ | $\angle AGE$ | $\angle DCA$ |
| 相等的角（写出一个即可） | $\angle CHE$ | $\angle EGF$ | $\angle EFG$ | $\angle BGD$ | $\angle BCE$ |

## 正确理由

1. $\angle AHD=\angle CHE$，理由：对顶角相等。
2. $\angle AGD=\angle EGF$，理由：对顶角相等。
3. $\angle BFC=\angle EFG$，理由：对顶角相等。
4. $\angle AGE=\angle BGD$，理由：对顶角相等。
5. $\angle DCA=\angle BCE$，理由：同角的余角相等。

第 ⑤ 个不是对顶角。因为两块三角尺的直角顶点重合，所以

$$
\angle DCA+\angle ACE=90^\circ
$$

且

$$
\angle BCE+\angle ACE=90^\circ
$$

因此

$$
\angle DCA=\angle BCE
$$

## 错因整理

原来容易把 ①②③④⑤ 都归为“对顶角相等”。其中 ①②③④ 可以用对顶角；⑤ 要看两个直角被同一个角 $\angle ACE$ 分割，属于“同角的余角相等”。

## 复习提示

遇到“角相等”的题，先判断是不是同两条直线相交形成的对顶角；如果不是，再看是否来自直角、平角或互余互补关系。
