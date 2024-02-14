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

const imgStyle = {
  margin: "auto", 
  display: "block", 
  maxHeight: "75vh", 
  borderRadius: "1rem"
}

function IntroSlide({ slideId }: { slideId: number | null }) {
  const [isSelective, setIsSelective] = useState<boolean | null>(false); // 選択式にするかどうか
  const slides = [
    "slide1.png",
    "slide2.png",
    "slide3.png",
    "slide4.png",
    "slide5.png",
    "slide6.png",
  ];

  function handleClick(e: any) {
    if (isSelective === true) {
      setIsSelective(false);
    } else {
      setIsSelective(true);
    }
  }

  return (
    <Swiper
      spaceBetween={30}
      effect={"fade"}
      navigation={true}
      pagination={{
        clickable: true,
      }}
      modules={[EffectFade, Navigation, Pagination]}
      className="mySwiper, bg-white"
      style={{
        zIndex: "0",
        width: "60vw",
        maxHeight: "90vh",
        margin: "0 0 0 auto",
        padding: "1rem",
        borderRadius: "3rem",
      }}
    >
      {/* {} */}
      {isSelective ? (
        slides.map((slide, key) => {
          return (
            <SwiperSlide
              key={key}
              style={{ zIndex: "-10"}}
            >
              <img style = {imgStyle} src={`slides/${slide}`} />
            </SwiperSlide>
          );
        })
      ) : (
        <SwiperSlide style={{ zIndex: "0"}}>
          <img style = {imgStyle} src={`slides/slide${slideId}.png`} />
        </SwiperSlide>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "right",
          alignItems: "center",
          paddingTop: "0.3rem ",
        }}
      >
        <button
          onClick={handleClick}
          style={{
            backgroundColor: "#FFC436",
            padding: "0.2rem 1rem",
            borderRadius: "0.5rem",
            fontWeight: "bold",
            zIndex: "9999",
          }}
        >
          {isSelective ? <>選択モード</> : <>自動モード</>}
        </button>
      </div>
    </Swiper>
  );
}

export default IntroSlide;
