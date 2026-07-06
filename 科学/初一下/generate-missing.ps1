$env:CODEX_CLI_JS = "D:\npm-global\node_modules\@openai\codex\bin\codex.js"
$script = "C:\Users\yang0\.agents\skills\baoyu-image-gen\scripts\main.ts"

$jobs = @(
    @{p="生命科学-生殖与发育\卡08-玉米杂交种子.md";     i="生命科学-生殖与发育\08-card.png"}
    @{p="生命科学-生殖与发育\卡11-摘心去顶芽.md";         i="生命科学-生殖与发育\11-card.png"}
    @{p="生命科学-生殖与发育\卡16-埃博拉病毒结构.md";     i="生命科学-生殖与发育\16-card.png"}
    @{p="生命科学-生殖与发育\卡18-有性无性繁殖.md";       i="生命科学-生殖与发育\18-card.png"}
    @{p="生命科学-生殖与发育\卡19-花受精发育.md";         i="生命科学-生殖与发育\19-card.png"}
    @{p="生命科学-生殖与发育\卡20-完全不完全变态.md";     i="生命科学-生殖与发育\20-card.png"}
    @{p="生命科学-生殖与发育\卡21-种子萌发条件.md";       i="生命科学-生殖与发育\21-card.png"}
    @{p="生命科学-生殖与发育\卡22-玉米菜豆种子营养.md";   i="生命科学-生殖与发育\22-card.png"}
    @{p="物质科学-微观粒子与元素\卡06-二氧化碳微观宏观.md"; i="物质科学-微观粒子与元素\06-card.png"}
    @{p="物质科学-微观粒子与元素\卡08-常见化学式.md";     i="物质科学-微观粒子与元素\08-card.png"}
    @{p="物质科学-微观粒子与元素\卡09-常见离子符号.md";   i="物质科学-微观粒子与元素\09-card.png"}
    @{p="物质科学-微观粒子与元素\卡10-H2O化学式信息.md";  i="物质科学-微观粒子与元素\10-card.png"}
    @{p="物质科学-微观粒子与元素\卡11-化合价计算.md";     i="物质科学-微观粒子与元素\11-card.png"}
    @{p="物质科学-微观粒子与元素\卡12-硫元素化合价比较.md"; i="物质科学-微观粒子与元素\12-card.png"}
    @{p="物质科学-微观粒子与元素\卡13-铬元素化合价.md";   i="物质科学-微观粒子与元素\13-card.png"}
    @{p="物质科学-微观粒子与元素\卡14-氮元素化合价.md";   i="物质科学-微观粒子与元素\14-card.png"}
    @{p="物质科学-微观粒子与元素\卡16-分子原子离子.md";   i="物质科学-微观粒子与元素\16-card.png"}
    @{p="物质科学-微观粒子与元素\卡17-原子结构等式.md";   i="物质科学-微观粒子与元素\17-card.png"}
    @{p="物质科学-微观粒子与元素\卡18-离子形成.md";       i="物质科学-微观粒子与元素\18-card.png"}
    @{p="物质科学-微观粒子与元素\卡19-物质分类两步法.md"; i="物质科学-微观粒子与元素\19-card.png"}
    @{p="物质科学-微观粒子与元素\卡20-化学符号数字位置含义.md"; i="物质科学-微观粒子与元素\20-card.png"}
    @{p="物质科学-测量与物态变化\卡02-称量指定质量食盐.md"; i="物质科学-测量与物态变化\02-card.png"}
    @{p="物质科学-测量与物态变化\卡04-游码未归零修正.md"; i="物质科学-测量与物态变化\04-card.png"}
    @{p="物质科学-测量与物态变化\卡05-液体质量测量错误.md"; i="物质科学-测量与物态变化\05-card.png"}
    @{p="物质科学-测量与物态变化\卡06-天平放反和磨损.md"; i="物质科学-测量与物态变化\06-card.png"}
    @{p="物质科学-测量与物态变化\卡11-冰块加盐白霜.md";   i="物质科学-测量与物态变化\11-card.png"}
    @{p="物质科学-测量与物态变化\卡12-量筒读数.md";       i="物质科学-测量与物态变化\12-card.png"}
    @{p="物质科学-测量与物态变化\卡13-温度计使用.md";     i="物质科学-测量与物态变化\13-card.png"}
    @{p="物质科学-测量与物态变化\卡14-晶体非晶体熔化.md"; i="物质科学-测量与物态变化\14-card.png"}
    @{p="物质科学-测量与物态变化\卡15-沸腾条件.md";       i="物质科学-测量与物态变化\15-card.png"}
    @{p="物质科学-测量与物态变化\卡16-蒸发与沸腾.md";     i="物质科学-测量与物态变化\16-card.png"}
    @{p="物质科学-测量与物态变化\卡17-白气液化.md";       i="物质科学-测量与物态变化\17-card.png"}
)

$base = "g:\初中\科学\初一下"
$total = $jobs.Count
$ok = 0
for ($i=0; $i -lt $total; $i++) {
    $j = $jobs[$i]
    $pf = Join-Path "$base\prompts" $j.p
    $img = Join-Path "$base\figures" $j.i
    $num = $i + 1
    Remove-Item "$env:USERPROFILE\.cache\baoyu-codex-imagegen\codex-exec.lock" -Force -ErrorAction SilentlyContinue
    Write-Output "[$num/$total] $($j.i)"
    bun $script --promptfiles "$pf" --image "$img" --ar 4:3 --provider codex-cli 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $ok++ } else { Write-Output "  FAILED: $($j.i)" }
}

Write-Output "DONE: $ok/$total generated (failures: $($total - $ok))"
