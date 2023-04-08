<template>
  <div ref="container" style="position: relative; left: 720px; top: 710px; width: 280px;"></div>
</template>
  
<script>
export default {
  mounted() {
    const colors = ['red', 'white'];
    const intervals = [-80, 10];
    let gradient = 'linear-gradient(to right, ';
    const label = document.createElement('div');
    label.innerHTML = 'Grace Mass Change cm/year';
    label.style.textAlign = 'center';
    label.style.fontSize = "15px"
    this.$refs.container.appendChild(label);
    const colorbar = document.createElement('div');
    colorbar.style.width = '280px';
    colorbar.style.height = '18px';
    this.$refs.container.appendChild(colorbar);
    for (let i = 0; i < colors.length; i++) {
      gradient += colors[i] + ' ' + ((intervals[i] - intervals[0]) / (intervals[intervals.length - 1] - intervals[0]) * 100) + '%';
      if (i < colors.length - 1) {
        gradient += ', ';
      }
      // 添加数字标签
      const label = document.createElement('div');
      label.innerHTML = intervals[i];
      label.style.position = 'absolute';
      label.style.bottom = '-25px';
      label.style.left = (i / (colors.length - 1) * 100) + '%';
      label.style.transform = 'translate(-50%, 0%)';
      label.style.fontSize = '15px';
      label.style.color = 'black';
      colorbar.appendChild(label);
    }
    gradient += ')';
    colorbar.style.background = gradient;
  }
}
</script>
  