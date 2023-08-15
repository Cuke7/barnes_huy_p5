import P5 from "p5";
import { Node, NodeBody } from "./tree";

class Body {
  pos: P5.Vector;
  vel: P5.Vector;
  acc: P5.Vector;
  index: number;
  mass: number;

  constructor(x: number, y: number, index: number, mass: number) {
    this.pos = new P5.Vector(x, y);
    this.vel = new P5.Vector(0, 0);
    this.acc = new P5.Vector(0, 0);
    this.index = index;
    this.mass = mass;
  }

  draw(p5: P5) {
    p5.fill(255);
    p5.noStroke();
    p5.ellipse(this.pos.x, this.pos.y, this.mass);
    p5.stroke("blue");
    p5.strokeWeight(5);
  }

  calcForces(otherBody: Body) {
    if (otherBody.index != this.index) {
      const force = P5.Vector.sub(otherBody.pos, this.pos);
      force.mult((this.mass * otherBody.mass) / (force.mag() * force.mag()));
      this.acc.add(force).div(2);
    }
  }

  updateBody() {
    this.acc.limit(0.1);
    this.vel.add(this.acc);
    this.vel.limit(3);
    this.pos.add(this.vel);
    if (this.pos.x > canvaWidth) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = canvaWidth;
    if (this.pos.y > canvaHeight) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = canvaHeight;
  }
}

let tree;
let canvaWidth = 1000;
let canvaHeight = 800;

// Show how body is affected by nodeBody
const customUpdate = (p5: P5, nodeBody: NodeBody, body: NodeBody) => {
  p5.stroke("blue");
  p5.strokeWeight(2);
  const forceDirection = P5.Vector.sub(nodeBody.pos, body.pos);
  drawArrow(p5, body.pos, forceDirection.mult(0.4), "blue");
};

const sketch = (p5: P5) => {
  p5.setup = () => {
    const canvas = p5.createCanvas(1000, 800);
    canvas.parent("app");
    p5.background(0);
    p5.rectMode(p5.CORNERS);
  };

  p5.draw = () => {
    // Build bodies array
    const bodies: Body[] = [];
    bodies.push(new Body(200, 220, 0, 50));
    bodies.push(new Body(100, 50, 1, 20));
    bodies.push(new Body(900, 50, 2, 20));
    bodies.push(new Body(p5.mouseX, p5.mouseY, 3, 40));

    // Reset canva
    p5.background(0);

    // Buil the tree
    tree = new Node(
      p5.createVector(0, 0),
      p5.createVector(canvaWidth, 0),
      p5.createVector(canvaWidth, canvaHeight),
      p5.createVector(0, canvaHeight),
      0
    );
    for (const body of bodies) {
      tree.addBody(body);
    }

    // Update and draw bodies
    for (const body of bodies) {
      tree.calcForces(p5, body, customUpdate);
      body.draw(p5);
    }

    // Draw the tree
    tree.draw(p5);
  };
};

new P5(sketch);

function drawArrow(p5: P5, base: P5.Vector, vec: P5.Vector, myColor: string) {
  p5.push();
  p5.stroke(myColor);
  p5.strokeWeight(3);
  p5.fill(myColor);
  p5.translate(base.x, base.y);
  p5.line(0, 0, vec.x, vec.y);
  p5.rotate(vec.heading());
  let arrowSize = 7;
  p5.translate(vec.mag() - arrowSize, 0);
  p5.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  p5.pop();
}
