import * as THREE from 'three'
import { Component, UComponent, register } from '@shared/basic'
import { Vector3 } from '@shared/component/physicsComponent'

// For THREE.js =============================================
@register()
export class Color extends UComponent {
    constructor(public r: number, public g: number, public b: number) { super(); }
    get() { return new THREE.Color(this.r, this.g, this.b); }
}

export abstract class Geometry extends UComponent {
    constructor() { super(); }
    abstract get(): THREE.BufferGeometry;
};
@register()
export class SphereGeometry extends Geometry {
    constructor(public radius: number) { super(); }
    get() { return new THREE.SphereGeometry(this.radius); }
};
@register()
export class PlaneGeometry extends Geometry {
    constructor(public width: number, public height: number) { super(); }
    get() { return new THREE.PlaneGeometry(this.width, this.height); }
};
@register()
export class BoxGeometry extends Geometry {
    constructor(public width: number, public height: number, public depth: number) { super(); }
    get() { return new THREE.BoxGeometry(this.width, this.height, this.depth); }
};
export abstract class Material extends UComponent {
    constructor() { super(); }
    abstract get(): THREE.Material
};
@register()
export class MeshBasicMaterial extends Material {
    constructor(public color: Color) { super(); }
    get() { return new THREE.MeshBasicMaterial({color: this.color.get()}); }
};
@register()
export class MeshPhongMaterial extends Material {
    constructor(public color: Color, public transparent: boolean = false, public opacity: number = 1, public shininess: number = 30) { super(); }
    get() { return new THREE.MeshPhongMaterial({color: this.color.get(), transparent: this.transparent, opacity: this.opacity, shininess: this.shininess}); }
};
@register()
export class DetectorMaterial extends Material {
    constructor(public width : number, public height : number, public depth : number, public edgeWidth = 0.01, ) { super(); }
    get() {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                edgeWidth: { value: this.edgeWidth }, // 边的宽度
                dimensions: { value: new THREE.Vector3(this.width, this.height, this.depth) } // 长宽高
            },
            vertexShader: `
              varying vec3 vPosition;
              void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float edgeWidth;
              uniform vec3 dimensions;
              varying vec3 vPosition;
              void main() {
                vec3 halfDimensions = dimensions * 0.5;
                vec3 absPos = abs(vPosition);
                int cnt = 0;
                if(absPos.x > halfDimensions.x - edgeWidth) ++cnt;
                if(absPos.y > halfDimensions.y - edgeWidth) ++cnt;
                if(absPos.z > halfDimensions.z - edgeWidth) ++cnt;
                if (cnt >= 2) {
                  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // 边的颜色
                } else {
                  discard; // 丢弃非边界部分
                }
              }
            `,
            transparent: true // 使非边界部分透明
        });
        return material;
    }
};
@register()
export class LineBasicMaterial extends Material {
    constructor(public color: Color) { super(); }
    get() { return new THREE.LineBasicMaterial({color: this.color.get()}); }
};

@register()
export class SetMesh extends UComponent {
    constructor(public geometry: Geometry, public material: Material) { super(); }
    get() { return new THREE.Mesh(this.geometry.get(), this.material.get()); }
};
@register()
export class LineSegments extends UComponent {
    constructor(public geometry: Geometry, public material: Material) { super(); }
    get() { return new THREE.LineSegments(new THREE.EdgesGeometry(this.geometry.get()), this.material.get()); }
};
@register()
export class SetMeshByPath extends UComponent {
    constructor(public name: string, public args?: any) { super(); }
};
@register()
export class MeshByPathLoaded extends UComponent {
    constructor(public name: string, public args: any) { super(); }
};
@register()
export class TexturePlane extends UComponent {
    constructor(public name: string, public position: Vector3) { super(); }
};
@register()
export class WaterBlock extends UComponent {
    constructor(public p1: Vector3, public p2: Vector3) { super(); }
};