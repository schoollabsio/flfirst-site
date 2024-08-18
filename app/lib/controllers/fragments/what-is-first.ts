import { Fragment } from "./interface";

export class WhatIsFirst implements Fragment {
  constructor(private ctx: {}) {}

  async render(params: { id: string }) {
    return `
            <div class="bg-white shadow-md p-4 max-w-prose mx-auto">
                <h1 class="text-xl font-bold text-center text-gray-900">What is First Tech Challenge™?</h1>
                <div class="mt-5">
                    <p class="mb-5">FIRST Tech Challenge (FTC) is a robotics competition for students in grades 7-12 that aims to inspire young people to be leaders in science and technology. It is part of the broader FIRST (For Inspiration and Recognition of Science and Technology) program founded by Dean Kamen.</p>
                    <p>FTC teams are tasked with designing, building, and programming robots to compete in an alliance format against other teams. The competitions are both challenging and fun, combining the excitement of sport with the rigors of science and technology.</p>
                </div>
            </div>
        `;
  }
}
