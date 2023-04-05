<template>
  <div id="map"></div>
  <div>
    <router-view></router-view>
  </div>
  <div id="colorbar"></div>
</template>
<script>
import mapboxgl from 'mapbox-gl';
export default {
  name: 'App',
  mounted() {
    //mapbox的识别码
    mapboxgl.accessToken = 'pk.eyJ1IjoienhwMDYxMSIsImEiOiJjbGI2bzJ0b3kwMnh5M3FvZHppcjBnb3FoIn0.-bw5-bWnBcVLIg-wbB7oQA';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10', //地图样式
      center: [-42.6043, 76.7069], //格陵兰岛中心点坐标
      zoom: 2.2, //缩放大小
      scrollZoom: false, // 禁用滚动缩放功能
      dragPan: false,
    });
    map.on('load', function () {
      //添加流域边界数据
      map.addSource('greenlandCw', {
        type: 'geojson',
        data: './src/data/cw_boundary.json'
      });

      map.addSource('greenlandNe', {
        type: 'geojson',
        data: './src/data/ne_boundary.json'
      });

      map.addSource('greenlandNo', {
        type: 'geojson',
        data: './src/data/no_boundary.json'
      });

      map.addSource('greenlandNw', {
        type: 'geojson',
        data: './src/data/nw_boundary.json'
      });

      map.addSource('greenlandSe', {
        type: 'geojson',
        data: './src/data/se_boundary.json'
      });

      map.addSource('greenlandSw', {
        type: 'geojson',
        data: './src/data/sw_boundary.json'
      });

      //添加点的质量变化速度数据
      map.addSource('GreenlandVel', {
        type: 'geojson',
        data: './src/data/Vel.json'
      });

      //把点上的质量变化速度在图上绘制出来
      map.addLayer({
        id: 'Vel',
        type: 'circle',
        source: 'GreenlandVel',
        paint: {
          'circle-radius': 8,
          // 使用插值函数将速度属性值映射到一个颜色值范围内
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            -71, 'red',
            8, 'white'
          ]
        }
      });

      //创建colorbar控件
      class ColorbarControl {
        constructor() {
          this.container = document.createElement('div');
          this.container.className = 'colorbar';
          this.container.style.padding = '10px';


          const colors = ['red', 'white'];
          const intervals = [-80, 10];
          let gradient = 'linear-gradient(to right, ';
          const label = document.createElement('div');
          label.innerHTML = 'Mass Change cm/year';
          label.style.textAlign = 'center';
          label.style.fontSize = "15px"
          this.container.appendChild(label);
          for (let i = 0; i < colors.length; i++) {
            gradient += colors[i] + ' ' + ((intervals[i] - intervals[0]) / (intervals[intervals.length - 1] - intervals[0]) * 100) + '%';
            if (i < colors.length - 1) {
              gradient += ', ';
            }
            // 添加数字标签
            const label = document.createElement('div');
            label.innerHTML = intervals[i];
            label.style.position = 'absolute';
            label.style.bottom = '-10px';
            label.style.left = (i / (colors.length - 1) * 100) + '%';
            label.style.transform = 'translate(-50%, 0%)';
            label.style.fontSize = '15px';
            label.style.color = 'black';
            this.container.appendChild(label);
          }
          gradient += ')';

          const colorbar = document.createElement('div');
          colorbar.style.background = gradient;
          colorbar.style.width = '220px';
          colorbar.style.height = '15px';
          this.container.appendChild(colorbar);
        }

        onAdd(map) {
          this.map = map;
          return this.container;
        }

        onRemove() {
          this.container.parentNode.removeChild(this.container);
          this.map = undefined;
        }
      }

      map.addControl(new ColorbarControl(), 'bottom-right');


      //为各个流域添加边界线
      map.addLayer({
        id: 'greenlandCw-line',
        type: 'line',
        source: 'greenlandCw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true,
      });

      //添加各个流域名称
      map.addLayer({
        id: 'greenlandCw-marker',
        type: 'symbol',
        source: 'greenlandCw',
        layout: {
          'text-field': 'CW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
      });

      //为各个流域添加可点击区域
      map.addLayer({
        id: 'greenlandCw-fill',
        type: 'fill',
        source: 'greenlandCw',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
      });

      //点击各个区域时显示出Mass Change的图表
      map.on('click', 'greenlandCw-fill', function (e) {
        window.location.href = 'http://localhost:7070/#/cw'
      });

      map.addLayer({
        id: 'greenlandNe-line',
        type: 'line',
        source: 'greenlandNe',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandNe-marker',
        type: 'symbol',
        source: 'greenlandNe',
        layout: {
          'text-field': 'NE', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
      });

      map.addLayer({
        id: 'greenlandNe-fill',
        type: 'fill',
        source: 'greenlandNe',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
      });

      map.on('click', 'greenlandNe-fill', function (e) {
        window.location.href = 'http://localhost:7070/#/ne'
      });

      map.addLayer({
        id: 'greenlandNo-line',
        type: 'line',
        source: 'greenlandNo',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandNo-marker',
        type: 'symbol',
        source: 'greenlandNo',
        layout: {
          'text-field': 'NO', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
      });

      map.addLayer({
        id: 'greenlandNo-fill',
        type: 'fill',
        source: 'greenlandNo',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
      });

      map.on('click', 'greenlandNo-fill', function (e) {
        window.location.href = 'http://localhost:7070/#/no'
      });

      map.addLayer({
        id: 'greenlandNw-line',
        type: 'line',
        source: 'greenlandNw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandNw-marker',
        type: 'symbol',
        source: 'greenlandNw',
        layout: {
          'text-field': 'NW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
      });

      map.addLayer({
        id: 'greenlandNw-fill',
        type: 'fill',
        source: 'greenlandNw',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
      });

      map.on('click', 'greenlandNw-fill', function (e) {
        window.location.href = 'http://localhost:7070/#/nw'
      });

      map.addLayer({
        id: 'greenlandSe-line',
        type: 'line',
        source: 'greenlandSe',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandSe-marker',
        type: 'symbol',
        source: 'greenlandSe',
        layout: {
          'text-field': 'SE', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
      });

      map.addLayer({
        id: 'greenlandSe-fill',
        type: 'fill',
        source: 'greenlandSe',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
      });

      map.on('click', 'greenlandSe-fill', function (e) {
        window.location.href = 'http://localhost:7070/#/se'
      });

      map.addLayer({
        id: 'greenlandSw-line',
        type: 'line',
        source: 'greenlandSw',
        layout: {},
        'paint': {
          'line-color': '#FF3300'
        },
        interactive: true,
        clickable: true
      });

      map.addLayer({
        id: 'greenlandSw-marker',
        type: 'symbol',
        source: 'greenlandSw',
        layout: {
          'text-field': 'SW', // 名称
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20
        }
      });

      map.addLayer({
        id: 'greenlandSw-fill',
        type: 'fill',
        source: 'greenlandSw',
        layout: {},
        'paint': {
          'fill-color': 'transparent'
        },
        interactive: true,
        clickable: true,
      });

      map.on('click', 'greenlandSw-fill', function (e) {
        window.location.href = 'http://localhost:7070/#/sw'
      });

      // 创建一个按钮元素
      var button = document.createElement('button');
      button.innerHTML = 'Mass Change';
      button.style.position = 'absolute';
      button.style.top = '10px';
      button.style.right = '400px';
      button.style.zIndex = '9999';
      button.style.padding = '10px';
      button.style.backgroundColor = '##F0F0EF';
      button.style.color = 'gray';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      button.style.fontSize = '14px';
      button.style.cursor = 'pointer';

      // 将按钮添加到地图容器中
      map.getContainer().appendChild(button);

      // 为按钮添加 click 事件处理程序
      button.addEventListener('click', function () {
        // 在单击时将用户重定向到新页面
        window.location.href = 'http://localhost:7070/#/greenland';
      });
    });
  }
}
</script>
<style>
.colorbar {
  position: absolute;
  bottom: 15px;
  left: -500px;
  transform: translateX(-50%);
}
</style>
