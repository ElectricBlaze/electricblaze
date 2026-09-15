# Demo media sources

Placeholder files for the synthetic demo feeds. Served through jsDelivr from
this repository until the ElectricBlaze CDN exists:

    https://cdn.jsdelivr.net/gh/ElectricBlaze/electricblaze@89e2819/demo/media/<file>

## Videos

| File         | Size     | Source                                                    | License   |
|--------------|----------|-----------------------------------------------------------|-----------|
| reel-01.mp4  | 540x960  | Pexels video 13736675, "A barista serving a cup of coffee" | Pexels    |
| reel-02.mp4  | 540x960  | Pexels video 13737099, "Man making coffee"                 | Pexels    |
| video-01.mp4 | 1280x720 | Big Buck Bunny, Blender Foundation, via test-videos.co.uk  | CC BY 3.0 |
| video-02.mp4 | 1280x720 | Sintel, Blender Foundation, via test-videos.co.uk          | CC BY 3.0 |

## Photos

All from Pexels, cropped to Instagram ratios (1:1, 4:5, 9:16 covers, 16:9 covers).

| File          | Pexels photo | File          | Pexels photo |
|---------------|--------------|---------------|--------------|
| post-01.jpg   | 5865195      | post-10-1.jpg | 12088122     |
| post-03.jpg   | 2159074      | post-10-2.jpg | 3252051      |
| post-05.jpg   | 8936890      | post-11.jpg   | 5490932      |
| post-07.jpg   | 2159065      | reel-01.jpg   | 36765287     |
| post-09.jpg   | 14251130     | reel-02.jpg   | 15571480     |
| post-04-1.jpg | 19596282     | video-01.jpg  | 7454461      |
| post-04-2.jpg | 16155698     | video-02.jpg  | 19256947     |
| post-04-3.jpg | 30173526     | avatar.jpg    | 34158721     |

Pexels license: free for commercial use, no attribution required
(https://www.pexels.com/license/). Blender films: (c) Blender Foundation,
https://www.bigbuckbunny.org/ and https://durian.blender.org/, CC BY 3.0.

Demo feeds reference media by commit hash (`@89e2819`), not by branch:
jsDelivr caches branch lookups for hours but serves commit-pinned URLs
immediately and forever. When media files change, update the hash in the
demo feeds in the following commit.
