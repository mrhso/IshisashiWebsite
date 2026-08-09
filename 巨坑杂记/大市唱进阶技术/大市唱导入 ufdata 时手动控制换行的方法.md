[vsqx.top 版](https://www.vsqx.top/article/an96)

注意以下所有变量名都会随着版本不同而变化，所以需要自行寻找代换。

搜 `"🏠一会儿补充"` 定位负责导入处理的 JS：

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/1370f25121502977062a317d069bd1c60f1fa522.png)

搜 `= 4;` 定位，记住数组名 `_2044` 与函数名 `_2045`：

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/c6c7663e949d2afac669afa8d6e5940314bc1fb0.png)

搜 `'+~'` 定位，找到上方的换行代码，并记住 `_2058`：

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/26bf1fb8f9d0d7994870dffba9bb1462b9dfe736.png)
```JavaScript
_2044.push(_2058);
_2049();
```
将其修改为：
```JavaScript
if (_2058[F("lyric")] && _2058[F("lyric")].includes("|"))
{
   _2058[F("lyric")] = _2058[F("lyric")].replace(/\|/gu, "");
   _2044.push(_2058);
   _2045(_2044.length - 1);
}
else
{
   _2044.push(_2058);
}
```
![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/fa67f61658242b998b311b7a28346d8a1d784168.png)

这样导入时就会在 ufdata 中歌词写着 `|` 的音符后断行。
