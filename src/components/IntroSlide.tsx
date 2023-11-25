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

function IntroSlide({ slideId }: { slideId: number | null }) {
  const slides = [
    "slide1.png",
    "slide2.png",
    "slide3.png",
    "slide4.png",
    "slide5.png",
    "slide6.png",
  ];

  return (
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
        width: "800px",
        margin: "0 0 0 auto",
        padding: "2rem 2rem",
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
      <SwiperSlide style={{ zIndex: "-10" }}>
        <img src={`slides/slide${slideId}.png`} />
      </SwiperSlide>
    </Swiper>
  );
}

export default IntroSlide;
