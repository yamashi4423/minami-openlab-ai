import React, { useRef, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

// import required modules
import { EffectFade, Navigation, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css";

function IntroSlide() {
  const slides = [
    "slide1.png",
    "slide2.png",
    "slide3.png",
    "slide4.png",
    "slide5.png",
    "slide6.png",
  ];

  return (
    <div style={{ position: "relative" }}>
      <Swiper
        spaceBetween={30}
        effect={"fade"}
        navigation={true}
        pagination={{
          clickable: true,
        }}
        modules={[EffectFade, Navigation, Pagination]}
        className="mySwiper"
        style={{
          zIndex: "-10",
          width: "700px",
          position: "absolute",
          top: "-8rem",
          right: "0",
          margin: "0 4rem",
          borderRadius: "0.5rem",
        }}
      >
        {slides.map((slide, key) => {
          return (
            <SwiperSlide key={key} style={{ zIndex: "-10" }}>
              <img src={`slides/${slide}`} />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export default IntroSlide;
